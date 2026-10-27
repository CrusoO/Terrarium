"""One raw Bedrock stream dump for a full-app prompt. Stops at the first text token."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import boto3
from botocore.config import Config

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.llm import bedrock_region  # noqa: E402

PROMPT = (
    "Build a customer/order tracker web app. Staff enter customer name, order items, "
    "pickup date, and payment status. Show a searchable order list, order detail panel, "
    "and a dashboard that displays daily totals. Use Vite React, in-memory mock data, "
    "no backend. Reply with tagged file blocks only."
)
OUT = ROOT / "docs" / "codegen-metrics" / "stream-dump.json"


def main() -> None:
    client = boto3.client(
        "bedrock-runtime",
        region_name=bedrock_region(),
        config=Config(connect_timeout=10, read_timeout=60, retries={"max_attempts": 0}),
    )
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 16000,
            "temperature": 0.3,
            "system": "Reply with the requested file blocks only.",
            "messages": [{"role": "user", "content": PROMPT}],
        }
    )
    started = time.monotonic()
    events = []
    response = client.invoke_model_with_response_stream(
        modelId="eu.anthropic.claude-sonnet-4-6",
        body=body,
        contentType="application/json",
        accept="application/json",
    )
    stream = response.get("body")
    try:
        for event in stream:
            now = round(time.monotonic() - started, 3)
            chunk = event.get("chunk")
            if not chunk:
                events.append({"t": now, "event": "empty"})
                continue
            data = json.loads(chunk.get("bytes", b"{}").decode("utf-8"))
            kind = str(data.get("type") or "unknown")
            text = ""
            if kind == "content_block_delta":
                text = ((data.get("delta") or {}).get("text") or "")
            events.append({
                "t": now,
                "type": kind,
                "deltaType": (data.get("delta") or {}).get("type") if isinstance(data.get("delta"), dict) else None,
                "textChars": len(text),
                "usage": (data.get("message") or {}).get("usage") if kind == "message_start" else data.get("usage"),
            })
            if text:
                break
    finally:
        close = getattr(stream, "close", None)
        if close:
            close()
    OUT.write_text(json.dumps({"model": "eu.anthropic.claude-sonnet-4-6", "events": events}, indent=2), encoding="utf-8")
    print(json.dumps(events, indent=2))


if __name__ == "__main__":
    main()
