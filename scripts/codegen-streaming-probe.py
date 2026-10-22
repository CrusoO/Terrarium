from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))

from terrarium_agents.llm import (  # noqa: E402
    bedrock_model,
    bedrock_model_ids,
    bedrock_ready,
    bedrock_region,
    cert_bundle,
    gemini_api_key,
    model_for_provider,
    nvidia_api_key,
    nvidia_base_url,
    nvidia_enabled,
)


PROMPT = (
    "Return a tiny Vite React FileMap JSON with index.html, src/main.jsx, "
    "src/App.jsx, and src/styles.css for a customer order tracker. Code only."
)


def _now() -> float:
    return time.monotonic()


def _record(provider: str, model: str, fn: Callable[[], tuple[str, dict[str, Any]]]) -> dict[str, Any]:
    started = _now()
    try:
        text, usage = fn()
        duration = _now() - started
        output_tokens = usage.get("outputTokens")
        if not isinstance(output_tokens, int):
            output_tokens = max(1, round(len(text) / 4))
            usage["usageSource"] = "estimate"
        return {
            "provider": provider,
            "model": model,
            "ok": True,
            "durationSeconds": round(duration, 3),
            "timeToFirstTokenSeconds": usage.pop("timeToFirstTokenSeconds", None),
            "outputTokens": output_tokens,
            "tokensPerSecond": round(output_tokens / duration, 2) if duration else None,
            **usage,
        }
    except Exception as error:
        return {
            "provider": provider,
            "model": model,
            "ok": False,
            "error": f"{type(error).__name__}: {error}",
        }


def _probe_gemini() -> tuple[str, dict[str, Any]]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=gemini_api_key())
    model = model_for_provider("gemini", "codegen")
    text_parts: list[str] = []
    first: float | None = None
    started = _now()
    stream = client.models.generate_content_stream(
        model=model,
        contents=PROMPT,
        config=types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=4096,
            response_mime_type="application/json",
        ),
    )
    usage: dict[str, Any] = {}
    chunk_log: list[dict[str, float | int]] = []
    for chunk in stream:
        chunk_text = getattr(chunk, "text", None) or ""
        if chunk_text:
            now = _now()
            if first is None:
                first = now
            text_parts.append(chunk_text)
            chunk_log.append(
                {
                    "t": round(now - started, 4),
                    "chars": len(chunk_text),
                    "cumulativeChars": sum(len(part) for part in text_parts),
                }
            )
        meta = getattr(chunk, "usage_metadata", None)
        if meta is not None:
            usage = {
                "inputTokens": getattr(meta, "prompt_token_count", None),
                "outputTokens": getattr(meta, "candidates_token_count", None),
                "totalTokens": getattr(meta, "total_token_count", None),
                "usageSource": "gemini",
            }
    usage["timeToFirstTokenSeconds"] = round((first or _now()) - started, 3)
    usage["chunkCount"] = len(chunk_log)
    usage["chunkTimeline"] = chunk_log[:20]
    usage["incremental"] = len(chunk_log) > 1
    return "".join(text_parts), {key: value for key, value in usage.items() if value is not None}


def _probe_nvidia() -> tuple[str, dict[str, Any]]:
    import httpx

    model = model_for_provider("nvidia", "codegen")
    headers = {"Authorization": f"Bearer {nvidia_api_key()}", "Content-Type": "application/json"}
    body = {
        "model": model,
        "messages": [{"role": "user", "content": PROMPT}],
        "temperature": 0.2,
        "max_tokens": 4096,
        "stream": True,
    }
    started = _now()
    first: float | None = None
    text_parts: list[str] = []
    usage: dict[str, Any] = {}
    with httpx.Client(timeout=120, verify=cert_bundle() or True) as client:
        with client.stream("POST", nvidia_base_url().rstrip("/") + "/chat/completions", headers=headers, json=body) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line or not line.startswith("data:"):
                    continue
                raw = line.removeprefix("data:").strip()
                if raw == "[DONE]":
                    break
                data = json.loads(raw)
                delta = ((data.get("choices") or [{}])[0].get("delta") or {}).get("content") or ""
                if delta and first is None:
                    first = _now()
                text_parts.append(delta)
                if isinstance(data.get("usage"), dict):
                    raw_usage = data["usage"]
                    usage = {
                        "inputTokens": raw_usage.get("prompt_tokens"),
                        "outputTokens": raw_usage.get("completion_tokens"),
                        "totalTokens": raw_usage.get("total_tokens"),
                        "usageSource": "nvidia",
                    }
    usage["timeToFirstTokenSeconds"] = round((first or _now()) - started, 3)
    return "".join(text_parts), {key: value for key, value in usage.items() if value is not None}


def _probe_bedrock() -> tuple[str, dict[str, Any]]:
    import boto3
    from botocore.config import Config

    model = bedrock_model()
    client = boto3.client(
        "bedrock-runtime",
        region_name=bedrock_region(),
        config=Config(read_timeout=180, connect_timeout=10, retries={"max_attempts": 0}),
    )
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "temperature": 0.2,
            "messages": [{"role": "user", "content": PROMPT}],
        }
    )
    started = _now()
    first: float | None = None
    text_parts: list[str] = []
    usage: dict[str, Any] = {}
    last_error: Exception | None = None
    for model_id in bedrock_model_ids(model):
        try:
            response = client.invoke_model_with_response_stream(
                modelId=model_id,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            chunk_log: list[dict[str, float | int]] = []
            for event in response.get("body", []):
                chunk = event.get("chunk")
                if not chunk:
                    continue
                data = json.loads(chunk.get("bytes", b"{}").decode("utf-8"))
                if data.get("type") == "content_block_delta":
                    delta = ((data.get("delta") or {}).get("text") or "")
                    if delta:
                        now = _now()
                        if first is None:
                            first = now
                        text_parts.append(delta)
                        chunk_log.append(
                            {
                                "t": round(now - started, 4),
                                "chars": len(delta),
                                "cumulativeChars": sum(len(part) for part in text_parts),
                            }
                        )
                if data.get("type") == "message_delta" and isinstance(data.get("usage"), dict):
                    raw_usage = data["usage"]
                    usage = {
                        "outputTokens": raw_usage.get("output_tokens"),
                        "usageSource": "bedrock",
                    }
            usage["timeToFirstTokenSeconds"] = round((first or _now()) - started, 3)
            usage["chunkCount"] = len(chunk_log)
            usage["chunkTimeline"] = chunk_log[:20]
            usage["incremental"] = len(chunk_log) > 1
            return "".join(text_parts), {key: value for key, value in usage.items() if value is not None}
        except Exception as error:
            last_error = error
    raise last_error or RuntimeError("No Bedrock model IDs available")


def main() -> None:
    results: list[dict[str, Any]] = []
    if bedrock_ready():
        results.append(_record("bedrock", bedrock_model(), _probe_bedrock))
    if gemini_api_key():
        results.append(_record("gemini", model_for_provider("gemini", "codegen"), _probe_gemini))
    if nvidia_enabled():
        results.append(_record("nvidia", model_for_provider("nvidia", "codegen"), _probe_nvidia))
    out = {
        "prompt": PROMPT,
        "results": results,
        "note": "One-off streaming probe only; it does not change the generation pipeline.",
    }
    output = Path(os.environ.get("STREAMING_PROBE_OUT", "docs/codegen-metrics/streaming-probe.json"))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(out, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(out, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
