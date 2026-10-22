"""TTFT for one full-app prompt across max_tokens and model id.

First token means the first streamed content_block_delta whose delta.text is
non-empty. message_start, content_block_start, and usage events do not count.
The stream is closed after that delta so these calls do not generate a full app.

In-region uses the foundation model id. Cross-region uses the eu. inference profile.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import boto3
from botocore.config import Config

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages" / "agents"))
import terrarium_agents.llm  # noqa: E402,F401  loads .env

PROMPT = (
    "Build a customer/order tracker web app. Staff enter customer name, order items, "
    "pickup date, and payment status. Show a searchable order list, order detail panel, "
    "and a dashboard that displays daily totals. Use Vite React, in-memory mock data. "
    "Reply with tagged file blocks only."
)
SYSTEM = "Reply with the requested file blocks only."


def _one(client, model_id: str, max_tokens: int) -> dict:
    body = json.dumps(
        {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": 0.3,
            "system": SYSTEM,
            "messages": [{"role": "user", "content": PROMPT}],
        }
    )
    started = time.monotonic()
    seen: list[str] = []
    try:
        response = client.invoke_model_with_response_stream(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        for event in response.get("body", []):
            chunk = event.get("chunk")
            if not chunk:
                continue
            data = json.loads(chunk.get("bytes", b"{}").decode("utf-8"))
            kind = str(data.get("type") or "unknown")
            seen.append(kind)
            delta = ""
            if kind == "content_block_delta":
                delta = ((data.get("delta") or {}).get("text") or "")
            if delta:
                return {
                    "modelId": model_id,
                    "maxTokens": max_tokens,
                    "ok": True,
                    "timeToFirstTokenSeconds": round(time.monotonic() - started, 3),
                    "firstTokenEvent": "content_block_delta.text",
                    "eventsBeforeFirstToken": seen[:-1],
                    "firstTokenChars": len(delta),
                }
        return {
            "modelId": model_id,
            "maxTokens": max_tokens,
            "ok": False,
            "failReason": "no_text_delta",
            "eventsSeen": seen,
            "timeToFirstTokenSeconds": None,
        }
    except Exception as error:
        return {
            "modelId": model_id,
            "maxTokens": max_tokens,
            "ok": False,
            "failReason": f"{type(error).__name__}: {error}",
            "timeToFirstTokenSeconds": None,
            "seconds": round(time.monotonic() - started, 3),
        }


def main() -> None:
    region = os.environ.get("AWS_REGION", "eu-central-1")
    client = boto3.client(
        "bedrock-runtime",
        region_name=region,
        config=Config(connect_timeout=10, read_timeout=60, retries={"max_attempts": 0}),
    )
    rows = []
    for model_id in ("anthropic.claude-sonnet-4-6", "eu.anthropic.claude-sonnet-4-6"):
        for max_tokens in (4096, 8192, 16000):
            row = _one(client, model_id, max_tokens)
            row["region"] = region
            row["profile"] = "in-region" if not model_id.startswith("eu.") else "eu-cross-region"
            rows.append(row)
            print(json.dumps(row), flush=True)
    path = Path("docs/codegen-metrics/ttft-matrix.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "firstTokenDefinition": "First content_block_delta with non-empty delta.text. message_start and content_block_start do not count.",
                "rows": rows,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
