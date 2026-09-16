"""Shared LLM wiring. Keys stay in env — never in prompts or source."""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

AgentsMode = Literal["stub", "live"]
JsonPurpose = Literal["plan", "codegen"]

DEFAULT_INTENT_MODEL = "gemini-3.5-flash-lite"
DEFAULT_EDITOR_MODEL = "gemini-3.5-flash-lite"  # Updated: gemini-2.5-pro is deprecated
DEFAULT_GEMINI_CODEGEN_MODEL = "gemini-3.5-flash-lite"
DEFAULT_NVIDIA_PLAN_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1"
DEFAULT_NVIDIA_CODEGEN_MODEL = "mistralai/codestral-22b-instruct-v0.1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_BEDROCK_MODEL = "anthropic.claude-sonnet-4-6"
DEFAULT_BEDROCK_REGION = "eu-central-1"
DEFAULT_BEDROCK_READ_TIMEOUT_S = 45.0
DEFAULT_BEDROCK_CONNECT_TIMEOUT_S = 10.0
DEFAULT_GEMINI_JSON_TIMEOUT_MS = 25_000
DEFAULT_NVIDIA_JSON_TIMEOUT_S = 30.0

_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.I)
_THINK = re.compile(r"<think>.*?</think>", re.I | re.S)
_LOG_EXCERPT_CHARS = 1800

logger = logging.getLogger(__name__)
_ACTIVE_BUNDLE: str | None = None
_LLM_CALLS: list[dict[str, Any]] = []


def record_llm_call(
    *,
    purpose: str,
    provider: str,
    model: str,
    duration_ms: int,
    ok: bool,
) -> None:
    _LLM_CALLS.append(
        {
            "purpose": purpose,
            "provider": provider,
            "model": model,
            "durationMs": duration_ms,
            "ok": ok,
        }
    )


def drain_llm_calls() -> list[dict[str, Any]]:
    calls = list(_LLM_CALLS)
    _LLM_CALLS.clear()
    return calls


def _load_dotenv() -> None:
    here = Path(__file__).resolve()
    candidates = [
        Path.cwd() / ".env",
        here.parents[3] / ".env",  # repo root from packages/agents/terrarium_agents
    ]
    for path in candidates:
        if path.is_file():
            load_dotenv(path, override=False)
            return
    load_dotenv(override=False)


def _certifi_path() -> str | None:
    try:
        import certifi

        return certifi.where()
    except Exception:
        return None


def cert_bundle() -> str | None:
    return _ACTIVE_BUNDLE or _certifi_path()


def _merged_cert_bundle() -> str | None:
    """certifi plus optional corp/Zscaler PEMs from TERRARIUM_EXTRA_CA_FILE."""
    base = _certifi_path()
    extra = (os.environ.get("TERRARIUM_EXTRA_CA_FILE") or "").strip()
    extra_path = Path(extra) if extra else None
    if extra_path is None or not extra_path.is_file():
        return base
    parts: list[str] = []
    if base:
        parts.append(Path(base).read_text(encoding="ascii"))
    parts.append(extra_path.read_text(encoding="ascii"))
    combined = Path(os.environ.get("TERRARIUM_CA_BUNDLE_CACHE", "/tmp/terrarium-ca-bundle.pem"))
    combined.write_text("\n".join(parts) + "\n", encoding="ascii")
    return str(combined)


def _configure_tls() -> None:
    """Use certifi in Linux containers. Merge Zscaler/corp CAs when provided.

    Docker cannot see the Windows trust store. If Zscaler (or similar) MITMs
    Gemini, mount that root PEM and set TERRARIUM_EXTRA_CA_FILE.
    """
    global _ACTIVE_BUNDLE
    bundle = _merged_cert_bundle()
    _ACTIVE_BUNDLE = bundle
    if bundle:
        os.environ["SSL_CERT_FILE"] = bundle
        os.environ["REQUESTS_CA_BUNDLE"] = bundle
        os.environ["CURL_CA_BUNDLE"] = bundle
    if sys.platform in {"win32", "darwin"}:
        try:
            import truststore

            truststore.inject_into_ssl()
        except Exception:
            pass


_load_dotenv()
_configure_tls()


def gemini_api_key() -> str | None:
    key = (
        os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_GENAI_API_KEY")
        or ""
    ).strip()
    return key or None


def nvidia_api_key() -> str | None:
    key = (os.environ.get("NVIDIA_API_KEY") or os.environ.get("NGC_API_KEY") or "").strip()
    return key or None


def nvidia_base_url() -> str:
    return (
        os.environ.get("TERRARIUM_NVIDIA_BASE_URL", DEFAULT_NVIDIA_BASE_URL).strip()
        or DEFAULT_NVIDIA_BASE_URL
    )


def nvidia_plan_model() -> str:
    return (
        os.environ.get("TERRARIUM_NVIDIA_PLAN_MODEL", DEFAULT_NVIDIA_PLAN_MODEL).strip()
        or DEFAULT_NVIDIA_PLAN_MODEL
    )


def nvidia_codegen_model() -> str:
    return (
        os.environ.get("TERRARIUM_NVIDIA_CODEGEN_MODEL", DEFAULT_NVIDIA_CODEGEN_MODEL)
        .strip()
        or DEFAULT_NVIDIA_CODEGEN_MODEL
    )


def bedrock_region() -> str:
    return (
        os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or DEFAULT_BEDROCK_REGION
    ).strip() or DEFAULT_BEDROCK_REGION


def bedrock_model() -> str:
    return (os.environ.get("BEDROCK_MODEL") or DEFAULT_BEDROCK_MODEL).strip() or DEFAULT_BEDROCK_MODEL


def bedrock_read_timeout_s() -> float:
    raw = os.environ.get("BEDROCK_READ_TIMEOUT_S", "").strip()
    if not raw:
        return DEFAULT_BEDROCK_READ_TIMEOUT_S
    try:
        return max(5.0, float(raw))
    except ValueError:
        return DEFAULT_BEDROCK_READ_TIMEOUT_S


def bedrock_connect_timeout_s() -> float:
    raw = os.environ.get("BEDROCK_CONNECT_TIMEOUT_S", "").strip()
    if not raw:
        return DEFAULT_BEDROCK_CONNECT_TIMEOUT_S
    try:
        return max(2.0, float(raw))
    except ValueError:
        return DEFAULT_BEDROCK_CONNECT_TIMEOUT_S


def bedrock_ready() -> bool:
    return bool(
        (os.environ.get("AWS_ACCESS_KEY_ID") or "").strip()
        and (os.environ.get("AWS_SECRET_ACCESS_KEY") or "").strip()
    )


def bedrock_model_ids(model: str, region: str | None = None) -> list[str]:
    """EU Bedrock often needs the inference-profile prefix `eu.`."""
    name = model.strip()
    ids = [name]
    where = (region or bedrock_region()).lower()
    if where.startswith("eu") and not name.startswith(("eu.", "us.", "apac.")):
        ids.append(f"eu.{name}")
    return ids


def agents_mode() -> AgentsMode:
    explicit = os.environ.get("TERRARIUM_AGENTS", "").strip().lower()
    if explicit in {"stub", "live"}:
        return explicit  # type: ignore[return-value]
    return "live" if gemini_api_key() or nvidia_api_key() or bedrock_ready() else "stub"


def intent_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_INTENT", DEFAULT_INTENT_MODEL).strip() or DEFAULT_INTENT_MODEL


def plan_model() -> str:
    explicit = os.environ.get("TERRARIUM_MODEL_PLAN", "").strip()
    if nvidia_api_key():
        if explicit and not _looks_like_gemini(explicit):
            return explicit
        return DEFAULT_NVIDIA_PLAN_MODEL
    return explicit or DEFAULT_GEMINI_CODEGEN_MODEL


def codegen_model() -> str:
    explicit = os.environ.get("TERRARIUM_MODEL_CODEGEN", "").strip()
    if nvidia_api_key():
        if explicit and not _looks_like_gemini(explicit):
            return explicit
        return DEFAULT_NVIDIA_CODEGEN_MODEL
    return explicit or DEFAULT_GEMINI_CODEGEN_MODEL


def editor_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_EDITOR", DEFAULT_EDITOR_MODEL).strip() or DEFAULT_EDITOR_MODEL


def editor_gemini_api_key() -> str | None:
    key = (
        os.environ.get("GEMINI_API_KEY_EDITOR")
        or os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_GENAI_API_KEY")
        or ""
    ).strip()
    return key or None


@lru_cache(maxsize=1)
def editor_gemini_client():
    from google import genai

    key = editor_gemini_api_key()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY_EDITOR is missing. Set it in .env or export it, "
            "or set TERRARIUM_AGENTS=stub."
        )
    return genai.Client(api_key=key)


def _looks_like_gemini(model: str) -> bool:
    lowered = model.lower()
    return lowered.startswith("gemini") or lowered.startswith("models/gemini")


@lru_cache(maxsize=1)
def gemini_client():
    from google import genai

    key = gemini_api_key()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Set it in .env or export it, "
            "or set TERRARIUM_AGENTS=stub."
        )
    return genai.Client(api_key=key)


def complete_json(
    system: str,
    user: str,
    *,
    purpose: JsonPurpose = "codegen",
    nvidia_first: bool | None = None,
) -> dict[str, Any] | None:
    """Structured JSON from Bedrock (Claude), then Gemini / NVIDIA. None in stub mode."""
    if agents_mode() != "live":
        return None
    prefer_nvidia = bool(nvidia_first)
    providers: list[str] = []
    if prefer_nvidia:
        if nvidia_api_key():
            providers.append("nvidia")
        if bedrock_ready():
            providers.append("bedrock")
        if gemini_api_key():
            providers.append("gemini")
    else:
        if bedrock_ready():
            providers.append("bedrock")
        if gemini_api_key():
            providers.append("gemini")
        if nvidia_api_key():
            providers.append("nvidia")
    model = (
        nvidia_codegen_model()
        if prefer_nvidia and nvidia_api_key() and purpose == "codegen"
        else bedrock_model()
        if bedrock_ready()
        else (plan_model() if purpose == "plan" else codegen_model())
    )
    logger.info(
        "LLM %s starting providers=%s model=%s",
        purpose,
        ",".join(providers) or "none",
        model,
    )
    started = time.monotonic()
    last_provider = providers[-1] if providers else "none"
    last_model = model
    for provider in providers:
        if provider == "bedrock":
            used_model = bedrock_model()
            payload = _bedrock_json(system, user, used_model)
        elif provider == "nvidia":
            used_model = (
                nvidia_plan_model()
                if purpose == "plan"
                else nvidia_codegen_model()
            )
            payload = _nvidia_json(system, user, used_model)
        else:
            used_model = model if _looks_like_gemini(model) else DEFAULT_GEMINI_CODEGEN_MODEL
            payload = _gemini_json(system, user, used_model)
        last_provider = provider
        last_model = used_model
        elapsed_ms = int((time.monotonic() - started) * 1000)
        if payload is not None:
            record_llm_call(
                purpose=purpose,
                provider=provider,
                model=used_model,
                duration_ms=elapsed_ms,
                ok=True,
            )
            logger.info("LLM %s succeeded via %s", purpose, provider)
            return payload
        logger.warning("LLM %s got no JSON from %s; trying next provider", purpose, provider)
    record_llm_call(
        purpose=purpose,
        provider=last_provider,
        model=last_model,
        duration_ms=int((time.monotonic() - started) * 1000),
        ok=False,
    )
    logger.warning("LLM %s failed on every provider; returning no JSON", purpose)
    return None


def _bedrock_json(system: str, user: str, model: str) -> dict[str, Any] | None:
    if not bedrock_ready():
        return None
    try:
        import boto3
        from botocore.config import Config
        from botocore.exceptions import ClientError
    except ImportError:
        logger.warning("Bedrock skipped: boto3 is not installed")
        return None
    region = bedrock_region()
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 16000,
            "temperature": 0.3,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
    )
    client = boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(
            connect_timeout=bedrock_connect_timeout_s(),
            read_timeout=bedrock_read_timeout_s(),
            retries={"max_attempts": 1, "mode": "standard"},
        ),
    )
    last_error: Exception | None = None
    started = time.monotonic()
    for model_id in bedrock_model_ids(model, region):
        logger.info("Bedrock invoke_model start model=%s region=%s", model_id, region)
        try:
            response = client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            raw = json.loads(response["body"].read())
            chunks = raw.get("content") or []
            text = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in chunks
            )
            parsed = _loads_object(text.strip())
            _log_model_text("Bedrock", model_id, text, parsed)
            logger.info(
                "Bedrock finished model=%s in %.1fs json=%s",
                model_id,
                time.monotonic() - started,
                parsed is not None,
            )
            return parsed
        except ClientError as error:
            last_error = error
            code = (error.response or {}).get("Error", {}).get("Code", "")
            logger.warning("Bedrock ClientError model=%s code=%s: %s", model_id, code, error)
            continue
        except Exception as error:
            last_error = error
            logger.warning("Bedrock failed model=%s: %s", model_id, error)
            continue
    if last_error:
        logger.warning("Bedrock exhausted model ids for %s: %s", model, last_error)
    return None


def _gemini_json(system: str, user: str, model: str) -> dict[str, Any] | None:
    if not gemini_api_key():
        return None
    logger.info("Gemini generate_content start model=%s", model)
    started = time.monotonic()
    try:
        from google.genai import types

        response = gemini_client().models.generate_content(
            model=model,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=0.3,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                ),
                http_options=types.HttpOptions(timeout=DEFAULT_GEMINI_JSON_TIMEOUT_MS),
            ),
        )
        text = (response.text or "").strip()
        parsed = _loads_object(text)
        _log_model_text("Gemini", model, text, parsed)
        logger.info(
            "Gemini finished model=%s in %.1fs json=%s",
            model,
            time.monotonic() - started,
            parsed is not None,
        )
        return parsed
    except Exception as error:
        logger.warning(
            "Gemini failed model=%s after %.1fs: %s",
            model,
            time.monotonic() - started,
            error,
        )
        return None


def _nvidia_json(system: str, user: str, model: str) -> dict[str, Any] | None:
    key = nvidia_api_key()
    if not key:
        return None
    try:
        import httpx

        url = nvidia_base_url().rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        started = time.monotonic()
        with httpx.Client(timeout=DEFAULT_NVIDIA_JSON_TIMEOUT_S, verify=cert_bundle() or True) as client:
            logger.info("NVIDIA chat.completions start model=%s", model)
            data = None
            for use_json_object in (True, False):
                body: dict[str, Any] = {
                    "model": model,
                    "temperature": 0.2,
                    "max_tokens": 8192,
                    "messages": messages,
                }
                if use_json_object:
                    body["response_format"] = {"type": "json_object"}
                response = client.post(url, headers=headers, json=body)
                if response.status_code == 400 and use_json_object:
                    logger.warning(
                        "NVIDIA model=%s rejected json_object; retrying plain chat",
                        model,
                    )
                    continue
                if response.is_error:
                    logger.warning(
                        "NVIDIA HTTP %s model=%s body=%s",
                        response.status_code,
                        model,
                        (response.text or "")[:240],
                    )
                    response.raise_for_status()
                data = response.json()
                break
        if data is None:
            return None
        message = ((data.get("choices") or [{}])[0].get("message") or {})
        content = message.get("content") or ""
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        text = str(content).strip()
        parsed = _loads_object(text)
        _log_model_text("NVIDIA", model, text, parsed)
        logger.info(
            "NVIDIA finished model=%s in %.1fs json=%s",
            model,
            time.monotonic() - started,
            parsed is not None,
        )
        return parsed
    except Exception as error:
        logger.warning("NVIDIA failed model=%s: %s", model, error)
        return None


def _loads_object(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    cleaned = _THINK.sub("", text)
    cleaned = _FENCE.sub("", cleaned.strip()).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        data = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _log_model_text(
    provider: str, model: str, text: str, parsed: dict[str, Any] | None
) -> None:
    excerpt = _log_excerpt(text)
    if parsed is None:
        logger.warning("%s returned non-JSON model=%s excerpt=%s", provider, model, excerpt)
        return
    logger.info(
        "%s parsed JSON model=%s keys=%s excerpt=%s",
        provider,
        model,
        sorted(str(key) for key in parsed.keys())[:20],
        excerpt,
    )


def _log_excerpt(text: str) -> str:
    compact = text.replace("\r", "\\r").replace("\n", "\\n")
    if len(compact) <= _LOG_EXCERPT_CHARS:
        return compact
    return compact[:_LOG_EXCERPT_CHARS] + "...[truncated]"
