"""Diagnose Gemini ~153s TTFT: thinking level × JSON mode × timeouts.

Runs inside the API venv recommended:
  docker cp scripts/codegen-gemini-ttft-diag.py infra-api-1:/app/scripts/
  docker exec -w /app infra-api-1 /app/.venv/bin/python scripts/codegen-gemini-ttft-diag.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))

from terrarium_agents.llm import (  # noqa: E402
    DEFAULT_GEMINI_JSON_TIMEOUT_MS,
    gemini_api_key,
    model_for_provider,
)
from terrarium_agents.llm_stream import (  # noqa: E402
    DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S,
    DEFAULT_CODEGEN_TOTAL_TIMEOUT_S,
    stream_gemini_text,
)

PROMPT = (
    "Return a tiny Vite React app as tagged blocks for index.html, "
    "src/main.jsx, src/App.jsx, src/styles.css — customer order tracker. Code only.\n"
    'Use <<<FILE path="...>>> ... <<<END FILE>>> markers.'
)


def main() -> None:
    if not gemini_api_key():
        raise SystemExit("GEMINI_API_KEY missing")
    model = model_for_provider("gemini", "codegen")
    cases = [
        {"thinking_level": "low", "json_mode": True},
        {"thinking_level": "low", "json_mode": False},
        {"thinking_level": None, "json_mode": True},
        {"thinking_level": None, "json_mode": False},
    ]
    results = []
    for case in cases:
        started = time.monotonic()
        result = stream_gemini_text(
            "You generate small demo apps.",
            PROMPT,
            model,
            first_token_timeout_s=float(os.environ.get("DIAG_FIRST_TOKEN_S", "60")),
            total_timeout_s=float(os.environ.get("DIAG_TOTAL_S", "120")),
            json_mode=case["json_mode"],
            thinking_level=case["thinking_level"],
        )
        results.append(
            {
                **case,
                "ok": result.ok,
                "failReason": result.fail_reason,
                "timeToFirstTokenSeconds": result.time_to_first_token_s,
                "durationSeconds": round(result.duration_s, 3),
                "chunkCount": result.chunk_count,
                "outputChars": len(result.text),
                "wallSeconds": round(time.monotonic() - started, 3),
                "chunkTimeline": result.chunks[:12],
            }
        )
        print(json.dumps(results[-1], indent=2), flush=True)

    out = {
        "model": model,
        "configured": {
            "DEFAULT_GEMINI_JSON_TIMEOUT_MS": DEFAULT_GEMINI_JSON_TIMEOUT_MS,
            "DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S": DEFAULT_CODEGEN_FIRST_TOKEN_TIMEOUT_S,
            "DEFAULT_CODEGEN_TOTAL_TIMEOUT_S": DEFAULT_CODEGEN_TOTAL_TIMEOUT_S,
            "note_260s": (
                "Step0 codegen stage ~260s is NOT equal to DEFAULT_GEMINI_JSON_TIMEOUT_MS "
                f"({DEFAULT_GEMINI_JSON_TIMEOUT_MS / 1000:.0f}s). Observed ~263s was a stalled "
                "non-stream generate_content call that outlived/ignored the intended 180s "
                "HTTP timeout (SDK behavior, retries/backoff, and/or thinking delay before first byte)."
            ),
        },
        "results": results,
    }
    path = Path(os.environ.get("GEMINI_TTFT_DIAG_OUT", "docs/codegen-metrics/gemini-ttft-diag.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(out, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
