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
DEFAULT_FAST_MODEL = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
DEFAULT_LEAF_MODEL = "eu.anthropic.claude-haiku-5-5"
DEFAULT_PAGE_MODEL = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
DEFAULT_GEMINI_CODEGEN_MODEL = "gemini-3.8-flash"
DEFAULT_NVIDIA_PLAN_MODEL = "nvidia/llama-3.1-nemotron-ultra-253b-v1"
DEFAULT_NVIDIA_CODEGEN_MODEL = "mistralai/codestral-22b-instruct-v0.1"
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_BEDROCK_MODEL = "anthropic.claude-sonnet-4-6"
DEFAULT_BEDROCK_REGION = "eu-central-1"
DEFAULT_BEDROCK_READ_TIMEOUT_PLAN_S = 90.0
DEFAULT_BEDROCK_READ_TIMEOUT_CODEGEN_S = 300.0
DEFAULT_BEDROCK_CONNECT_TIMEOUT_S = 10.0
DEFAULT_GEMINI_JSON_TIMEOUT_MS = 180_000
DEFAULT_GEMINI_PLAN_TIMEOUT_MS = 45_000
DEFAULT_NVIDIA_JSON_TIMEOUT_S = 30.0

_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.I)
_THINK = re.compile(r"<think>.*?</think>", re.I | re.S)
_LOG_EXCERPT_CHARS = 1800

logger = logging.getLogger(__name__)
_ACTIVE_BUNDLE: str | None = None
_LLM_CALLS: list[dict[str, Any]] = []
_LAST_USAGE: dict[str, Any] | None = None


def record_llm_call(
    *,
    purpose: str,
    provider: str,
    model: str,
    duration_ms: int,
    ok: bool,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    total_tokens: int | None = None,
    usage_source: str | None = None,
    fail_reason: str | None = None,
    time_to_first_token_s: float | None = None,
    chunk_count: int | None = None,
    continued: bool | None = None,
) -> None:
    payload = {
        "purpose": purpose,
        "provider": provider,
        "model": model,
        "durationMs": duration_ms,
        "ok": ok,
    }
    if input_tokens is not None:
        payload["inputTokens"] = input_tokens
    if output_tokens is not None:
        payload["outputTokens"] = output_tokens
    if total_tokens is not None:
        payload["totalTokens"] = total_tokens
    if usage_source:
        payload["usageSource"] = usage_source
    if fail_reason:
        payload["failReason"] = fail_reason
    if time_to_first_token_s is not None:
        payload["timeToFirstTokenSeconds"] = time_to_first_token_s
    if chunk_count is not None:
        payload["chunkCount"] = chunk_count
    if continued:
        payload["continued"] = True
    _LLM_CALLS.append(payload)


def drain_llm_calls() -> list[dict[str, Any]]:
    calls = list(_LLM_CALLS)
    _LLM_CALLS.clear()
    return calls


def _set_last_usage(
    *,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
    total_tokens: int | None = None,
    source: str | None = None,
) -> None:
    global _LAST_USAGE
    _LAST_USAGE = {
        key: value
        for key, value in {
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "totalTokens": total_tokens,
            "usageSource": source,
        }.items()
        if value is not None
    } or None


def _consume_last_usage() -> dict[str, Any]:
    global _LAST_USAGE
    usage = dict(_LAST_USAGE or {})
    _LAST_USAGE = None
    return usage


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


def nvidia_enabled() -> bool:
    """NVIDIA is opt-in so a stale key in .env does not hijack Bedrock → Gemini routing."""
    if not nvidia_api_key():
        return False
    flag = (os.environ.get("TERRARIUM_ENABLE_NVIDIA") or "").strip().lower()
    return flag in {"1", "true", "yes", "on"}


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


def bedrock_read_timeout_s(purpose: JsonPurpose | None = None) -> float:
    if purpose == "codegen":
        raw = (
            os.environ.get("BEDROCK_CODEGEN_READ_TIMEOUT_S")
            or os.environ.get("BEDROCK_READ_TIMEOUT_S")
            or ""
        ).strip()
        default = DEFAULT_BEDROCK_READ_TIMEOUT_CODEGEN_S
    elif purpose == "plan":
        raw = (
            os.environ.get("BEDROCK_PLAN_READ_TIMEOUT_S")
            or os.environ.get("BEDROCK_READ_TIMEOUT_S")
            or ""
        ).strip()
        default = DEFAULT_BEDROCK_READ_TIMEOUT_PLAN_S
    else:
        raw = os.environ.get("BEDROCK_READ_TIMEOUT_S", "").strip()
        default = DEFAULT_BEDROCK_READ_TIMEOUT_PLAN_S
    if not raw:
        return default
    try:
        return max(5.0, float(raw))
    except ValueError:
        return default


def gemini_json_timeout_ms(purpose: JsonPurpose | None = None) -> int:
    if purpose == "plan":
        raw = os.environ.get("GEMINI_PLAN_TIMEOUT_S", "").strip()
        default = DEFAULT_GEMINI_PLAN_TIMEOUT_MS
    else:
        raw = os.environ.get("GEMINI_JSON_TIMEOUT_S", "").strip()
        default = DEFAULT_GEMINI_JSON_TIMEOUT_MS
    if not raw:
        return default
    try:
        return int(max(10.0, float(raw)) * 1000)
    except ValueError:
        return default


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
    """Bedrock model IDs to try (inference profiles before on-demand model IDs)."""
    name = model.strip()
    if not name:
        return []
    where = (region or bedrock_region()).lower()
    ids: list[str] = []
    profile = (os.environ.get("BEDROCK_INFERENCE_PROFILE") or "").strip()
    if profile:
        ids.append(profile)
    if name.startswith("arn:aws:bedrock:"):
        ids.append(name)
    elif name.startswith(("eu.", "us.", "apac.", "global.")):
        ids.append(name)
    else:
        if where.startswith("eu"):
            ids.append(f"eu.{name}")
        elif where.startswith("us"):
            ids.append(f"us.{name}")
        ids.append(name)
    seen: set[str] = set()
    ordered: list[str] = []
    for item in ids:
        if item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


def agents_mode() -> AgentsMode:
    explicit = os.environ.get("TERRARIUM_AGENTS", "").strip().lower()
    if explicit in {"stub", "live"}:
        return explicit  # type: ignore[return-value]
    return "live" if gemini_api_key() or nvidia_api_key() or bedrock_ready() else "stub"


def fast_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_FAST", DEFAULT_FAST_MODEL).strip() or DEFAULT_FAST_MODEL


def leaf_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_LEAF", DEFAULT_LEAF_MODEL).strip() or DEFAULT_LEAF_MODEL


def page_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_PAGE", DEFAULT_PAGE_MODEL).strip() or DEFAULT_PAGE_MODEL


def sampling_fields(model: str) -> dict[str, Any]:
    """Per-model request fields. Haiku 5.5 rejects a temperature field."""
    thinking = (os.environ.get("TERRARIUM_BEDROCK_THINKING") or "").strip().lower()
    if thinking == "minimal":
        return {"temperature": 1}
    if "haiku-5" in model.lower():
        return {}
    return {"temperature": 0.2 if "haiku" in model.lower() else 0.3}


def invoke_bedrock_text(
    system: str,
    user: str,
    model: str,
    *,
    max_tokens: int = 800,
    temperature: float = 0.2,
    purpose: str = "repair",
) -> dict[str, Any]:
    """One non-streaming Bedrock call. Replay is the default; live is opt-in."""
    from terrarium_agents.llm_fixtures import is_live, remember_invoke, resolve_invoke

    resolved = resolve_invoke(
        system,
        user,
        model,
        max_tokens=max_tokens,
        temperature=temperature,
        purpose=purpose,
    )
    if not is_live(resolved):
        return resolved
    result = _invoke_bedrock_text_live(
        system,
        user,
        model,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    remember_invoke(
        system,
        user,
        model,
        result,
        max_tokens=max_tokens,
        temperature=temperature,
        purpose=purpose,
    )
    return result


def _invoke_bedrock_text_live(
    system: str,
    user: str,
    model: str,
    *,
    max_tokens: int = 800,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """One non-streaming Bedrock call. Used by intent and the editor."""
    if not bedrock_ready():
        return {"ok": False, "text": "", "failReason": "not_configured", "model": model}
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError

    region = bedrock_region()
    body_obj: dict[str, Any] = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    fields = sampling_fields(model)
    if "temperature" in fields and "haiku-5" not in model.lower():
        fields = {**fields, "temperature": temperature}
    body_obj.update(fields)
    body = json.dumps(body_obj)
    client = boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(connect_timeout=bedrock_connect_timeout_s(), read_timeout=60, retries={"max_attempts": 0}),
    )
    started = time.monotonic()
    last_error: Exception | None = None
    for model_id in bedrock_model_ids(model, region):
        try:
            response = client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            raw = json.loads(response["body"].read())
            usage = raw.get("usage") if isinstance(raw, dict) else {}
            text = "".join(
                part.get("text", "") if isinstance(part, dict) else ""
                for part in (raw.get("content") or [])
            )
            duration_s = time.monotonic() - started
            return {
                "ok": True,
                "text": text.strip(),
                "model": model_id,
                "durationSeconds": round(duration_s, 3),
                "inputTokens": usage.get("input_tokens") if isinstance(usage, dict) else None,
                "outputTokens": usage.get("output_tokens") if isinstance(usage, dict) else None,
                "failReason": None,
            }
        except ClientError as error:
            last_error = error
            logger.warning("Bedrock text failed model=%s: %s", model_id, error)
            continue
    return {
        "ok": False,
        "text": "",
        "model": model,
        "durationSeconds": round(time.monotonic() - started, 3),
        "failReason": f"{type(last_error).__name__}:{last_error}" if last_error else "no_model",
    }


def intent_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_INTENT", DEFAULT_INTENT_MODEL).strip() or DEFAULT_INTENT_MODEL


def model_for_provider(provider: str, purpose: JsonPurpose) -> str:
    if provider == "bedrock":
        return bedrock_model()
    if provider == "nvidia":
        return nvidia_plan_model() if purpose == "plan" else nvidia_codegen_model()
    env_key = "TERRARIUM_MODEL_PLAN" if purpose == "plan" else "TERRARIUM_MODEL_CODEGEN"
    explicit = (os.environ.get(env_key) or "").strip()
    if explicit:
        return explicit
    return DEFAULT_GEMINI_CODEGEN_MODEL


_BEDROCK_AUTH_MARKERS = (
    "UnrecognizedClientException",
    "InvalidClientTokenId",
    "ExpiredTokenException",
    "IncompleteSignature",
    "SignatureDoesNotMatch",
)


def bedrock_rejected_credentials(reason: str | None) -> bool:
    """True when Bedrock refused the credentials, rather than the model missing."""
    text = reason or ""
    return any(marker in text for marker in _BEDROCK_AUTH_MARKERS)


def codegen_providers(failed_reason: str | None = None, order: list[str] | None = None) -> list[str]:
    """Codegen provider order.

    Gemini stays off the normal codegen order because of its free-tier cap.
    An authentication failure is not a model miss, so Gemini is added then:
    otherwise a rejected AWS token leaves codegen with no provider at all.
    """
    providers = list(order if order is not None else llm_provider_order("codegen"))
    if (
        bedrock_rejected_credentials(failed_reason)
        and gemini_api_key()
        and "gemini" not in providers
    ):
        providers.append("gemini")
    return providers


def llm_provider_order(purpose: JsonPurpose) -> list[str]:
    """Provider order for plan and codegen.

    Bedrock is first when it is configured. Any other provider that fails is
    followed by Bedrock, which is always appended when AWS credentials are set.
    """
    custom = (os.environ.get("TERRARIUM_LLM_PROVIDER_ORDER") or "").strip()
    if custom:
        allowed = {"bedrock", "gemini", "nvidia"}
        ordered = [
            part.strip().lower()
            for part in custom.split(",")
            if part.strip().lower() in allowed
        ]
    else:
        ordered = []
        if bedrock_ready():
            ordered.append("bedrock")
        if gemini_api_key():
            ordered.append("gemini")
        if nvidia_enabled():
            ordered.append("nvidia")
    available: list[str] = []
    for name in ordered:
        if name == "bedrock" and bedrock_ready():
            available.append("bedrock")
        elif name == "gemini" and gemini_api_key():
            available.append("gemini")
        elif name == "nvidia" and nvidia_enabled():
            available.append("nvidia")
    # Codegen stays on Bedrock. Gemini 3.8 Flash codegen is on a free-tier
    # daily cap; intent and the editor keep their own Gemini models.
    if purpose == "codegen" and os.environ.get("TERRARIUM_ENABLE_GEMINI_CODEGEN") != "1":
        available = [name for name in available if name != "gemini"]
    if bedrock_ready() and "bedrock" not in available:
        available.append("bedrock")
    return available


def plan_model() -> str:
    order = llm_provider_order("plan")
    if order:
        return model_for_provider(order[0], "plan")
    return DEFAULT_GEMINI_CODEGEN_MODEL


def codegen_model() -> str:
    order = llm_provider_order("codegen")
    if order:
        return model_for_provider(order[0], "codegen")
    return DEFAULT_GEMINI_CODEGEN_MODEL


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
    """Structured JSON via llm_provider_order. Bedrock is the fallback when another provider fails.

    For purpose=codegen, uses streaming with first-token (~25s) and total (~120s)
    timeouts plus automatic failover (see llm_stream). Plan stays non-streaming.
    """
    if agents_mode() != "live":
        return None
    if nvidia_first:
        logger.warning(
            "LLM %s nvidia_first is deprecated; use TERRARIUM_ENABLE_NVIDIA=1 instead",
            purpose,
        )
    if purpose == "codegen":
        from terrarium_agents.llm_stream import codegen_stream_enabled, stream_codegen_with_failover

        if codegen_stream_enabled():
            result = stream_codegen_with_failover(system, user)
            if result.ok and result.text.strip():
                parsed = _loads_object(result.text)
                _log_model_text(result.provider, result.model, result.text, parsed)
                if parsed is not None:
                    _set_last_usage(
                        input_tokens=result.input_tokens,
                        output_tokens=result.output_tokens,
                        total_tokens=result.total_tokens,
                        source=result.usage_source,
                    )
                    return parsed
                logger.warning(
                    "Codegen stream from %s returned text but no JSON; trying non-stream fallback path",
                    result.provider,
                )
            # If stream path exhausted providers with no JSON, fall through to legacy
            # non-stream attempts only when explicitly requested.
            if (os.environ.get("TERRARIUM_CODEGEN_STREAM_FALLBACK_JSON") or "").strip().lower() in {
                "1",
                "true",
                "yes",
                "on",
            }:
                logger.info("Codegen attempting legacy non-stream JSON after stream miss")
            else:
                return None

    providers = llm_provider_order(purpose)
    primary = providers[0] if providers else "none"
    primary_model = model_for_provider(primary, purpose) if providers else "none"
    logger.info(
        "LLM %s starting providers=%s primary=%s/%s",
        purpose,
        ",".join(providers) or "none",
        primary,
        primary_model,
    )
    started = time.monotonic()
    last_provider = primary
    last_model = primary_model
    for provider in providers:
        used_model = model_for_provider(provider, purpose)
        if provider == "bedrock":
            payload = _bedrock_json(system, user, used_model, purpose=purpose)
        elif provider == "nvidia":
            payload = _nvidia_json(system, user, used_model)
        else:
            payload = _gemini_json(system, user, used_model, purpose=purpose)
        last_provider = provider
        last_model = used_model
        elapsed_ms = int((time.monotonic() - started) * 1000)
        if payload is not None:
            usage = _consume_last_usage()
            record_llm_call(
                purpose=purpose,
                provider=provider,
                model=used_model,
                duration_ms=elapsed_ms,
                ok=True,
                input_tokens=usage.get("inputTokens"),
                output_tokens=usage.get("outputTokens"),
                total_tokens=usage.get("totalTokens"),
                usage_source=usage.get("usageSource"),
            )
            logger.info("LLM %s succeeded via %s", purpose, provider)
            return payload
        _consume_last_usage()
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


def _bedrock_json(
    system: str,
    user: str,
    model: str,
    *,
    purpose: JsonPurpose = "codegen",
) -> dict[str, Any] | None:
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
            read_timeout=bedrock_read_timeout_s(purpose),
            retries={"max_attempts": 1, "mode": "standard"},
        ),
    )
    last_error: Exception | None = None
    started = time.monotonic()
    for model_id in bedrock_model_ids(model, region):
        logger.info(
            "Bedrock invoke_model start model=%s region=%s purpose=%s timeout=%ss",
            model_id,
            region,
            purpose,
            bedrock_read_timeout_s(purpose),
        )
        try:
            response = client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            raw = json.loads(response["body"].read())
            usage = raw.get("usage") if isinstance(raw, dict) else None
            if isinstance(usage, dict):
                input_tokens = usage.get("input_tokens")
                output_tokens = usage.get("output_tokens")
                if isinstance(input_tokens, int) or isinstance(output_tokens, int):
                    _set_last_usage(
                        input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                        output_tokens=output_tokens if isinstance(output_tokens, int) else None,
                        total_tokens=(
                            input_tokens + output_tokens
                            if isinstance(input_tokens, int) and isinstance(output_tokens, int)
                            else None
                        ),
                        source="bedrock",
                    )
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


def _gemini_json(
    system: str,
    user: str,
    model: str,
    *,
    purpose: JsonPurpose | None = None,
) -> dict[str, Any] | None:
    if not gemini_api_key():
        return None
    timeout_ms = gemini_json_timeout_ms(purpose)
    logger.info(
        "Gemini generate_content start model=%s purpose=%s timeout=%ss",
        model,
        purpose,
        timeout_ms / 1000,
    )
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
                http_options=types.HttpOptions(timeout=timeout_ms),
            ),
        )
        text = (response.text or "").strip()
        usage = getattr(response, "usage_metadata", None)
        if usage is not None:
            input_tokens = getattr(usage, "prompt_token_count", None)
            output_tokens = getattr(usage, "candidates_token_count", None)
            total_tokens = getattr(usage, "total_token_count", None)
            _set_last_usage(
                input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                output_tokens=output_tokens if isinstance(output_tokens, int) else None,
                total_tokens=total_tokens if isinstance(total_tokens, int) else None,
                source="gemini",
            )
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
        usage = data.get("usage")
        if isinstance(usage, dict):
            input_tokens = usage.get("prompt_tokens")
            output_tokens = usage.get("completion_tokens")
            total_tokens = usage.get("total_tokens")
            _set_last_usage(
                input_tokens=input_tokens if isinstance(input_tokens, int) else None,
                output_tokens=output_tokens if isinstance(output_tokens, int) else None,
                total_tokens=total_tokens if isinstance(total_tokens, int) else None,
                source="nvidia",
            )
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
