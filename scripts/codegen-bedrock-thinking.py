"""Compare Bedrock codegen TTFT with thinking off vs minimal. Do not enable Priority.

Usage (API venv):
  python scripts/codegen-bedrock-thinking.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))

from terrarium_agents.llm import bedrock_model  # noqa: E402
from terrarium_agents.llm_stream import stream_bedrock_text  # noqa: E402

SHORT = "Return one tagged file only. <<<FILE path=\"src/App.jsx\">>> a 20-line React component <<<END FILE>>>"
FULL = (
    "Build a customer/order tracker web app. Staff enter customer name, order items, "
    "pickup date, and payment status. Show a searchable order list, order detail panel, "
    "and a dashboard that displays daily totals. Use Vite React, in-memory mock data. "
    "Reply with tagged file blocks only."
)


def main() -> None:
    rows = []
    cases = (("disabled", FULL), ("minimal", SHORT))
    for mode, prompt in cases:
        os.environ["TERRARIUM_BEDROCK_THINKING"] = mode
        result = stream_bedrock_text("Reply with the requested file blocks only.", prompt, bedrock_model())
        out_tokens = result.output_tokens or max(1, round(len(result.text) / 4))
        window = result.duration_s - (result.time_to_first_token_s or 0)
        if window < 0.25:
            window = result.duration_s
        rows.append(
            {
                "thinking": mode,
                "prompt": "full-app" if mode == "disabled" else "short",
                "promptCaching": False,
                "note": "System is a plain string. No cache_control checkpoints. Codegen default leaves thinking unset, which is off.",
                "ok": result.ok,
                "failReason": result.fail_reason,
                "model": result.model,
                "inputTokens": result.input_tokens,
                "outputTokens": result.output_tokens,
                "outputTokensEstimated": out_tokens if result.output_tokens is None else None,
                "timeToFirstTokenSeconds": result.time_to_first_token_s,
                "durationSeconds": round(result.duration_s, 3),
                "outputTokensPerSecond": round(out_tokens / max(window, 0.001), 2),
                "chunkCount": result.chunk_count,
            }
        )
        print(json.dumps(rows[-1], indent=2), flush=True)
    path = Path("docs/codegen-metrics/bedrock-thinking.json")
    path.write_text(json.dumps({"rows": rows}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
