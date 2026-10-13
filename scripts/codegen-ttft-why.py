"""Why a short Bedrock call is ~4s to first token and a full-app call is ~20s.

Same customer-order-tracker prompt as the nine-app run. Each full-app case is
stopped after about 100 tokens (~400 characters). First token is the first
non-empty content_block_delta text. message_start does not count, but its
input token count is recorded.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401  loads .env

from terrarium_agents.llm import bedrock_region  # noqa: E402

PROMPT = (
    "Build a customer/order tracker web app. Staff enter customer name, order items, "
    "pickup date, and payment status. Show a searchable order list, order detail panel, "
    "and a dashboard that displays daily totals. Use Vite React, in-memory mock data, "
    "no backend. Include package.json, vite.config.js, index.html, and src files. "
    "Reply with tagged file blocks only."
)
SHORT_SYSTEM = "Reply with the requested file blocks only."
LONG_SYSTEM = SHORT_SYSTEM + "\n" + "\n".join(
    f"Rule {index}: keep files small, use function components, and do not add a backend."
    for index in range(1, 180)
)
FIRST_FILE_PROMPT = (
    PROMPT
    + " Emit only the first file, package.json, as one tagged block, then stop. "
    "Do not emit any other file."
)
OUT = ROOT / "docs" / "codegen-metrics" / "ttft-why.json"


def _read(client, model_id: str, system: str, user: str, max_tokens: int, stop_chars: int) -> dict:
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": 0.3,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
    )
    started = time.monotonic()
    seen: list[str] = []
    chars = 0
    input_tokens = None
    ttft = None
    try:
        response = client.invoke_model_with_response_stream(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        stream = response.get("body")
        try:
            for event in stream:
                chunk = event.get("chunk")
                if not chunk:
                    continue
                data = json.loads(chunk.get("bytes", b"{}").decode("utf-8"))
                kind = str(data.get("type") or "unknown")
                seen.append(kind)
                if kind == "message_start":
                    usage = (data.get("message") or {}).get("usage") or {}
                    if isinstance(usage.get("input_tokens"), int):
                        input_tokens = usage["input_tokens"]
                delta = ""
                if kind == "content_block_delta":
                    delta = ((data.get("delta") or {}).get("text") or "")
                if delta:
                    if ttft is None:
                        ttft = round(time.monotonic() - started, 3)
                    chars += len(delta)
                    if chars >= stop_chars:
                        break
        finally:
            close = getattr(stream, "close", None)
            if close:
                close()
        if ttft is not None:
            return {
                "ok": True,
                "modelId": model_id,
                "maxTokens": max_tokens,
                "systemChars": len(system),
                "userChars": len(user),
                "timeToFirstTokenSeconds": ttft,
                "inputTokens": input_tokens,
                "stoppedAfterChars": chars,
                "eventsBeforeFirstToken": [item for item in seen if item != "content_block_delta"][:6],
            }
        return {
            "ok": False,
            "modelId": model_id,
            "failReason": "no_text_delta",
            "inputTokens": input_tokens,
            "eventsSeen": seen[:8],
            "elapsedSeconds": round(time.monotonic() - started, 3),
        }
    except Exception as error:
        return {
            "ok": False,
            "modelId": model_id,
            "failReason": f"{type(error).__name__}: {error}",
            "elapsedSeconds": round(time.monotonic() - started, 3),
        }


def main() -> None:
    region = bedrock_region()
    eu = boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(connect_timeout=10, read_timeout=60, retries={"max_attempts": 0}),
    )
    us = boto3.client(
        "bedrock-runtime",
        region_name="us-east-1",
        config=Config(connect_timeout=10, read_timeout=60, retries={"max_attempts": 0}),
    )
    cases = [
        ("short-control", eu, "eu.anthropic.claude-sonnet-4-6", "Reply in one short sentence.", "Say hello in five words.", 64),
        ("eu-short-system-full-app", eu, "eu.anthropic.claude-sonnet-4-6", SHORT_SYSTEM, PROMPT, 16000),
        ("eu-long-system-full-app", eu, "eu.anthropic.claude-sonnet-4-6", LONG_SYSTEM, PROMPT, 16000),
        ("us-profile-from-us-east-1", us, "us.anthropic.claude-sonnet-4-6", SHORT_SYSTEM, PROMPT, 16000),
        ("us-profile-from-eu-region", eu, "us.anthropic.claude-sonnet-4-6", SHORT_SYSTEM, PROMPT, 16000),
        ("haiku-4-5-full-app", eu, "eu.anthropic.claude-haiku-4-5-20251001-v1:0", SHORT_SYSTEM, PROMPT, 16000),
        ("haiku-5-5-full-app", eu, "eu.anthropic.claude-haiku-5-5", SHORT_SYSTEM, PROMPT, 16000),
        ("first-file-only", eu, "eu.anthropic.claude-sonnet-4-6", SHORT_SYSTEM, FIRST_FILE_PROMPT, 16000),
    ]
    rows = []
    for name, client, model_id, system, user, cap in cases:
        row = _read(client, model_id, system, user, cap, stop_chars=400)
        row["case"] = name
        rows.append(row)
        print(json.dumps({k: row.get(k) for k in ("case", "ok", "timeToFirstTokenSeconds", "inputTokens", "failReason")}))
    OUT.write_text(json.dumps({"rows": rows}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
