"""Streaming codegen with first-token / total timeouts and provider failover.

Used for purpose=codegen so a stalled Gemini/Bedrock call cannot burn ~260s
before the next provider is tried. Chunk timestamps are logged for Step 1B.
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Callable

logger = logging.getLogger(__name__)

DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S = 25.0
DEFAULT_CODEGEN_TOTAL_TIMEOUT_S = 120.0

ChunkCallback = Callable[[dict[str, Any]], None]


class LlmStreamTimeout(Exception):
    def __init__(self, reason: str, *, provider: str, model: str, elapsed_s: float) -> None:
        super().__init__(f"{provider}/{model}: {reason} after {elapsed_s:.1f}s")
        self.reason = reason
        self.provider = provider
        self.model = model
        self.elapsed_s = elapsed_s


@dataclass
class StreamResult:
    text: str
    provider: str
    model: str
    ok: bool
    fail_reason: str | None = None
    time_to_first_token_s: float | None = None
    duration_s: float = 0.0
    chunk_count: int = 0
    chunks: list[dict[str, Any]] = field(default_factory=list)
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None
    usage_source: str | None = None
    stop_reason: str | None = None
    cache_creation_input_tokens: int | None = None
    cache_read_input_tokens: int | None = None
    continued: bool = False


def codegen_first_token_timeout_s() -> float:
    raw = (os.environ.get("CODEGEN_FIRST_TOKEN_TIMEOUT_S") or "").strip()
    if not raw:
        return DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S
    try:
        return max(1.0, float(raw))
    except ValueError:
        return DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S


def codegen_total_timeout_s() -> float:
    raw = (os.environ.get("CODEGEN_TOTAL_TIMEOUT_S") or "").strip()
    if not raw:
        return DEFAULT_CODEGEN_TOTAL_TIMEOUT_S
    try:
        return max(5.0, float(raw))
    except ValueError:
        return DEFAULT_CODEGEN_TOTAL_TIMEOUT_S


def codegen_stream_enabled() -> bool:
    raw = (os.environ.get("TERRARIUM_CODEGEN_STREAM") or "1").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _deadline_check(
    *,
    started: float,
    first_token_at: float | None,
    first_token_timeout_s: float,
    total_timeout_s: float,
    provider: str,
    model: str,
) -> None:
    now = time.monotonic()
    elapsed = now - started
    if elapsed > total_timeout_s:
        raise LlmStreamTimeout("total_timeout", provider=provider, model=model, elapsed_s=elapsed)
    if first_token_at is None and elapsed > first_token_timeout_s:
        raise LlmStreamTimeout(
            "first_token_timeout", provider=provider, model=model, elapsed_s=elapsed
        )


def stream_bedrock_text(
    system: str,
    user: str,
    model: str,
    *,
    purpose: str = "codegen",
    first_token_timeout_s: float | None = None,
    total_timeout_s: float | None = None,
    on_chunk: ChunkCallback | None = None,
    max_tokens: int = 16000,
    cache_system: bool = False,
) -> StreamResult:
    """Replay, record, or live. The default mode never calls Bedrock."""
    from terrarium_agents.llm_fixtures import is_live, remember_stream, resolve_stream

    resolved = resolve_stream(
        system,
        user,
        model,
        purpose=purpose,
        max_tokens=max_tokens,
        cache_system=cache_system,
    )
    if not is_live(resolved):
        return resolved
    result = _stream_bedrock_text_live(
        system,
        user,
        model,
        purpose=purpose,
        first_token_timeout_s=first_token_timeout_s,
        total_timeout_s=total_timeout_s,
        on_chunk=on_chunk,
        max_tokens=max_tokens,
        cache_system=cache_system,
    )
    remember_stream(
        system,
        user,
        model,
        result,
        purpose=purpose,
        max_tokens=max_tokens,
        cache_system=cache_system,
    )
    return result


def _stream_bedrock_text_live(
    system: str,
    user: str,
    model: str,
    *,
    purpose: str = "codegen",
    first_token_timeout_s: float | None = None,
    total_timeout_s: float | None = None,
    on_chunk: ChunkCallback | None = None,
    max_tokens: int = 16000,
    cache_system: bool = False,
) -> StreamResult:
    from terrarium_agents.llm import (
        bedrock_connect_timeout_s,
        bedrock_model_ids,
        bedrock_ready,
        bedrock_region,
        sampling_fields,
    )

    ft = first_token_timeout_s if first_token_timeout_s is not None else codegen_first_token_timeout_s()
    total = total_timeout_s if total_timeout_s is not None else codegen_total_timeout_s()
    if not bedrock_ready():
        return StreamResult(text="", provider="bedrock", model=model, ok=False, fail_reason="not_configured")

    import boto3
    from botocore.config import Config

    region = bedrock_region()
    # Default codegen path does not enable extended thinking.
    # "disabled" is explicit off; "minimal" uses a small budget. Extended thinking
    # requires temperature 1.
    thinking = (os.environ.get("TERRARIUM_BEDROCK_THINKING") or "").strip().lower()
    body_obj: dict[str, Any] = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": user}],
    }
    body_obj.update(sampling_fields(model))
    if cache_system:
        body_obj["system"] = [
            {"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}
        ]
    else:
        body_obj["system"] = system
    if thinking == "disabled":
        body_obj["thinking"] = {"type": "disabled"}
    elif thinking == "minimal":
        body_obj["thinking"] = {"type": "enabled", "budget_tokens": 1024}
    body = json.dumps(body_obj)
    # Short connect timeout; stream read is enforced by our wall clock between chunks.
    client = boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(
            connect_timeout=bedrock_connect_timeout_s(),
            read_timeout=max(total + 5.0, 30.0),
            retries={"max_attempts": 0, "mode": "standard"},
        ),
    )
    last_error: Exception | None = None
    for model_id in bedrock_model_ids(model, region):
        started = time.monotonic()
        first_token_at: float | None = None
        parts: list[str] = []
        chunks: list[dict[str, Any]] = []
        usage: dict[str, Any] = {}
        try:
            logger.info(
                "Bedrock stream start model=%s region=%s purpose=%s first_token=%ss total=%ss",
                model_id,
                region,
                purpose,
                ft,
                total,
            )
            response = client.invoke_model_with_response_stream(
                modelId=model_id,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            for event in response.get("body", []):
                _deadline_check(
                    started=started,
                    first_token_at=first_token_at,
                    first_token_timeout_s=ft,
                    total_timeout_s=total,
                    provider="bedrock",
                    model=model_id,
                )
                chunk = event.get("chunk")
                if not chunk:
                    continue
                data = json.loads(chunk.get("bytes", b"{}").decode("utf-8"))
                delta = ""
                if data.get("type") == "content_block_delta":
                    delta = ((data.get("delta") or {}).get("text") or "")
                if delta:
                    now = time.monotonic()
                    if first_token_at is None:
                        first_token_at = now
                    parts.append(delta)
                    entry = {
                        "t": round(now - started, 4),
                        "provider": "bedrock",
                        "model": model_id,
                        "chars": len(delta),
                        "cumulativeChars": sum(len(p) for p in parts),
                        "delta": delta,
                    }
                    chunks.append(entry)
                    if on_chunk:
                        on_chunk(entry)
                    logger.debug(
                        "Bedrock stream chunk t=%.3fs chars=%s cum=%s",
                        entry["t"],
                        entry["chars"],
                        entry["cumulativeChars"],
                    )
                if data.get("type") == "message_delta":
                    delta_meta = data.get("delta") or {}
                    if isinstance(delta_meta, dict) and delta_meta.get("stop_reason"):
                        usage["stopReason"] = delta_meta.get("stop_reason")
                if data.get("type") == "message_delta" and isinstance(data.get("usage"), dict):
                    raw_usage = data["usage"]
                    usage["outputTokens"] = raw_usage.get("output_tokens")
                    if raw_usage.get("input_tokens") is not None:
                        usage["inputTokens"] = raw_usage.get("input_tokens")
                    for source_key, dest_key in (
                        ("cache_creation_input_tokens", "cacheCreationInputTokens"),
                        ("cache_read_input_tokens", "cacheReadInputTokens"),
                    ):
                        if isinstance(raw_usage.get(source_key), int):
                            usage[dest_key] = raw_usage.get(source_key)
                    usage["usageSource"] = "bedrock"
                if data.get("type") == "message_start" and isinstance(
                    (data.get("message") or {}).get("usage"), dict
                ):
                    raw_usage = data["message"]["usage"]
                    if raw_usage.get("input_tokens") is not None:
                        usage["inputTokens"] = raw_usage.get("input_tokens")
                    for source_key, dest_key in (
                        ("cache_creation_input_tokens", "cacheCreationInputTokens"),
                        ("cache_read_input_tokens", "cacheReadInputTokens"),
                    ):
                        if isinstance(raw_usage.get(source_key), int):
                            usage[dest_key] = raw_usage.get(source_key)
                    usage["usageSource"] = "bedrock"
            text = "".join(parts)
            duration = time.monotonic() - started
            ttft = (first_token_at - started) if first_token_at is not None else None
            logger.info(
                "Bedrock stream finished model=%s duration=%.2fs ttft=%s chunks=%s chars=%s",
                model_id,
                duration,
                f"{ttft:.3f}s" if ttft is not None else "none",
                len(chunks),
                len(text),
            )
            if not text:
                return StreamResult(
                    text="",
                    provider="bedrock",
                    model=model_id,
                    ok=False,
                    fail_reason="empty_stream",
                    duration_s=duration,
                    chunks=chunks,
                )
            return StreamResult(
                text=text,
                provider="bedrock",
                model=model_id,
                ok=True,
                time_to_first_token_s=ttft,
                duration_s=duration,
                chunk_count=len(chunks),
                chunks=chunks,
                input_tokens=usage.get("inputTokens") if isinstance(usage.get("inputTokens"), int) else None,
                output_tokens=usage.get("outputTokens") if isinstance(usage.get("outputTokens"), int) else None,
                usage_source=usage.get("usageSource"),
                stop_reason=usage.get("stopReason") if isinstance(usage.get("stopReason"), str) else None,
                cache_creation_input_tokens=usage.get("cacheCreationInputTokens")
                if isinstance(usage.get("cacheCreationInputTokens"), int)
                else None,
                cache_read_input_tokens=usage.get("cacheReadInputTokens")
                if isinstance(usage.get("cacheReadInputTokens"), int)
                else None,
            )
        except LlmStreamTimeout as error:
            logger.warning("Bedrock stream timeout model=%s: %s", model_id, error)
            return StreamResult(
                text="".join(parts),
                provider="bedrock",
                model=model_id,
                ok=False,
                fail_reason=error.reason,
                time_to_first_token_s=(first_token_at - started) if first_token_at else None,
                duration_s=time.monotonic() - started,
                chunk_count=len(chunks),
                chunks=chunks,
            )
        except Exception as error:
            last_error = error
            logger.warning("Bedrock stream failed model=%s: %s", model_id, error)
            continue
    return StreamResult(
        text="",
        provider="bedrock",
        model=model,
        ok=False,
        fail_reason=f"exhausted_ids:{type(last_error).__name__ if last_error else 'unknown'}:{last_error}"[:400],
    )


def stream_gemini_text(
    system: str,
    user: str,
    model: str,
    *,
    first_token_timeout_s: float | None = None,
    total_timeout_s: float | None = None,
    on_chunk: ChunkCallback | None = None,
    json_mode: bool = True,
    thinking_level: str | None = None,
) -> StreamResult:
    from terrarium_agents.llm import gemini_api_key, gemini_client

    ft = first_token_timeout_s if first_token_timeout_s is not None else codegen_first_token_timeout_s()
    total = total_timeout_s if total_timeout_s is not None else codegen_total_timeout_s()
    if not gemini_api_key():
        return StreamResult(text="", provider="gemini", model=model, ok=False, fail_reason="not_configured")

    from google.genai import types

    started = time.monotonic()
    first_token_at: float | None = None
    parts: list[str] = []
    chunks: list[dict[str, Any]] = []
    usage: dict[str, Any] = {}
    # Cap HTTP timeout to our total budget; retries disabled so we control failover.
    http_timeout_ms = int(min(total, 180.0) * 1000)
    config_kwargs: dict[str, Any] = {
        "system_instruction": system,
        "temperature": 0.3,
        "automatic_function_calling": types.AutomaticFunctionCallingConfig(disable=True),
        "http_options": types.HttpOptions(timeout=http_timeout_ms),
    }
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"
    # Gemini 3.x thinking — low when requested (diagnostic / optional prod knob).
    level = (thinking_level or os.environ.get("TERRARIUM_GEMINI_THINKING_LEVEL") or "").strip().lower()
    if level in {"minimal", "low", "medium", "high"}:
        try:
            config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_level=level)
        except Exception:
            try:
                config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=256 if level in {"minimal", "low"} else 1024)
            except Exception as error:
                logger.warning("Gemini thinking_config unsupported: %s", error)

    try:
        logger.info(
            "Gemini stream start model=%s json_mode=%s thinking=%s first_token=%ss total=%ss http_timeout_ms=%s",
            model,
            json_mode,
            level or "default",
            ft,
            total,
            http_timeout_ms,
        )
        stream = gemini_client().models.generate_content_stream(
            model=model,
            contents=user,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        for event in stream:
            _deadline_check(
                started=started,
                first_token_at=first_token_at,
                first_token_timeout_s=ft,
                total_timeout_s=total,
                provider="gemini",
                model=model,
            )
            delta = getattr(event, "text", None) or ""
            if delta:
                now = time.monotonic()
                if first_token_at is None:
                    first_token_at = now
                    logger.info(
                        "Gemini first token model=%s ttft=%.3fs",
                        model,
                        first_token_at - started,
                    )
                parts.append(delta)
                entry = {
                    "t": round(now - started, 4),
                    "provider": "gemini",
                    "model": model,
                    "chars": len(delta),
                    "cumulativeChars": sum(len(p) for p in parts),
                    "delta": delta,
                }
                chunks.append(entry)
                if on_chunk:
                    on_chunk(entry)
            meta = getattr(event, "usage_metadata", None)
            if meta is not None:
                usage = {
                    "inputTokens": getattr(meta, "prompt_token_count", None),
                    "outputTokens": getattr(meta, "candidates_token_count", None),
                    "totalTokens": getattr(meta, "total_token_count", None),
                    "usageSource": "gemini",
                }
        text = "".join(parts)
        duration = time.monotonic() - started
        ttft = (first_token_at - started) if first_token_at is not None else None
        logger.info(
            "Gemini stream finished model=%s duration=%.2fs ttft=%s chunks=%s chars=%s",
            model,
            duration,
            f"{ttft:.3f}s" if ttft is not None else "none",
            len(chunks),
            len(text),
        )
        if not text:
            return StreamResult(
                text="",
                provider="gemini",
                model=model,
                ok=False,
                fail_reason="empty_stream",
                duration_s=duration,
                chunks=chunks,
            )
        return StreamResult(
            text=text,
            provider="gemini",
            model=model,
            ok=True,
            time_to_first_token_s=ttft,
            duration_s=duration,
            chunk_count=len(chunks),
            chunks=chunks,
            input_tokens=usage.get("inputTokens") if isinstance(usage.get("inputTokens"), int) else None,
            output_tokens=usage.get("outputTokens") if isinstance(usage.get("outputTokens"), int) else None,
            total_tokens=usage.get("totalTokens") if isinstance(usage.get("totalTokens"), int) else None,
            usage_source=usage.get("usageSource"),
        )
    except LlmStreamTimeout as error:
        logger.warning("Gemini stream timeout model=%s: %s", model, error)
        return StreamResult(
            text="".join(parts),
            provider="gemini",
            model=model,
            ok=False,
            fail_reason=error.reason,
            time_to_first_token_s=(first_token_at - started) if first_token_at else None,
            duration_s=time.monotonic() - started,
            chunk_count=len(chunks),
            chunks=chunks,
        )
    except Exception as error:
        logger.warning(
            "Gemini stream failed model=%s after %.1fs: %s",
            model,
            time.monotonic() - started,
            error,
        )
        return StreamResult(
            text="".join(parts),
            provider="gemini",
            model=model,
            ok=False,
            fail_reason=f"{type(error).__name__}:{error}",
            time_to_first_token_s=(first_token_at - started) if first_token_at else None,
            duration_s=time.monotonic() - started,
            chunk_count=len(chunks),
            chunks=chunks,
        )


def stream_codegen_with_failover(
    system: str,
    user: str,
    *,
    on_chunk: ChunkCallback | None = None,
    on_attempt: Callable[[StreamResult], None] | None = None,
) -> StreamResult:
    """Try providers in order; failover on first-token/total timeout or empty/unusable stream."""
    from terrarium_agents.llm import llm_provider_order, model_for_provider, record_llm_call

    attempts: list[StreamResult] = []
    for provider in llm_provider_order("codegen"):
        model = model_for_provider(provider, "codegen")
        if provider == "bedrock":
            result = stream_bedrock_text(system, user, model, on_chunk=on_chunk)
        elif provider == "gemini":
            attempts_left = 3
            backoff = 2.0
            result = stream_gemini_text(system, user, model, on_chunk=on_chunk)
            while (
                not result.ok
                and "503" in (result.fail_reason or "")
                and attempts_left > 1
            ):
                attempts_left -= 1
                logger.warning("Gemini 503; retrying in %.1fs (%s left)", backoff, attempts_left)
                time.sleep(backoff)
                backoff *= 2
                result = stream_gemini_text(system, user, model, on_chunk=on_chunk)
        else:
            # NVIDIA stays on non-stream complete_json path for now.
            continue
        attempts.append(result)
        if on_attempt:
            on_attempt(result)
        record_llm_call(
            purpose="codegen",
            provider=result.provider,
            model=result.model,
            duration_ms=int(result.duration_s * 1000),
            ok=result.ok,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            total_tokens=result.total_tokens,
            usage_source=result.usage_source,
            fail_reason=result.fail_reason,
            time_to_first_token_s=result.time_to_first_token_s,
            chunk_count=result.chunk_count,
        )
        if result.ok and result.text.strip():
            if len(attempts) > 1:
                logger.info(
                    "Codegen stream failover succeeded via %s after %s",
                    result.provider,
                    ", ".join(f"{a.provider}:{a.fail_reason}" for a in attempts[:-1]),
                )
            return result
        logger.warning(
            "Codegen stream failover from %s/%s reason=%s",
            result.provider,
            result.model,
            result.fail_reason,
        )
    if attempts:
        return attempts[-1]
    return StreamResult(text="", provider="none", model="none", ok=False, fail_reason="no_providers")


def stream_with_one_continuation(
    system: str,
    user: str,
    model: str,
    *,
    on_chunk: ChunkCallback | None = None,
    on_before_continuation: Callable[[list[str]], None] | None = None,
    max_tokens: int = 16000,
) -> tuple[StreamResult, StreamResult | None]:
    """If the first reply stops at the cap, ask once for the remaining files.

    The continuation prompt starts after the last closed <<<END FILE>>> and
    names the files already finished. Chunks from both calls are delivered to
    on_chunk. The first result is marked continued. A second cap is not
    followed by another call.
    """
    from terrarium_agents.tagged_files import closed_file_prefix

    first = stream_bedrock_text(
        system, user, model, on_chunk=on_chunk, max_tokens=max_tokens
    )
    if first.stop_reason != "max_tokens" or not first.text:
        return first, None
    prefix, finished = closed_file_prefix(first.text)
    if not finished:
        return first, None
    if on_before_continuation:
        on_before_continuation(finished)
    follow = (
        user
        + "\n\nThe previous reply hit the output cap. Do not repeat these finished files: "
        + ", ".join(finished)
        + ". Continue after the last closed file and emit only the remaining tagged blocks."
    )
    second = stream_bedrock_text(
        system, follow, model, on_chunk=on_chunk, max_tokens=max_tokens
    )
    first.continued = True
    return first, second
