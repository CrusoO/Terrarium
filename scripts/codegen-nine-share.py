"""Regenerate the 3 prompts x 3 runs, keep files, and score scaffold share.

Also records stop_reason and whether the last tagged file closed.
Does not boot a sandbox. Does not raise max_tokens.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))

import importlib.util

_spec = importlib.util.spec_from_file_location(
    "codegen_token_share", ROOT / "scripts" / "codegen-token-share.py"
)
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)
summarize = _mod.summarize

from terrarium_agents.llm import bedrock_model  # noqa: E402
from terrarium_agents.llm_stream import stream_bedrock_text  # noqa: E402
from terrarium_agents.tagged_files import TaggedFileParser, stream_file_status  # noqa: E402

PROMPTS = [
    (
        "customer-order-tracker",
        "Build a customer/order tracker web app. Staff enter customer name, order items, "
        "pickup date, and payment status. Show a searchable order list, order detail panel, "
        "and a dashboard that displays daily totals. Use Vite React, in-memory mock data, "
        "no backend. Include package.json, vite.config.js, index.html, and src files.",
    ),
    (
        "ecommerce-catalogue",
        "Build an ecommerce catalogue web app. Shoppers browse a product grid, filter by "
        "category, open product detail, add items to a cart, and see a checkout summary. "
        "Use Vite React, in-memory mock data, no backend. Include package.json, "
        "vite.config.js, index.html, and src files.",
    ),
    (
        "operations-dashboard",
        "Build an operations dashboard web app. Supervisors enter jobs with owners and due "
        "dates, update status chips, and the app displays reports plus overdue work. Use "
        "Vite React, in-memory mock data, no backend. Include package.json, vite.config.js, "
        "index.html, and src files.",
    ),
]
SYSTEM = (
    "You write a Vite React app. Emit one block per file and nothing else:\n"
    '<<<FILE path="relative/path">>>\ncontents\n<<<END FILE>>>'
)


def _files(text: str) -> dict[str, str]:
    parser = TaggedFileParser()
    parser.feed(text)
    parser.finish()
    return dict(parser.files)


def main() -> None:
    rows = []
    out = Path("docs/codegen-metrics/token-share-9.json")
    for name, prompt in PROMPTS:
        for index in range(1, 4):
            result = stream_bedrock_text(SYSTEM, prompt, bedrock_model(), max_tokens=16000)
            files = _files(result.text)
            status = stream_file_status(
                result.text,
                stop_reason=result.stop_reason,
                output_tokens=result.output_tokens,
                max_tokens=16000,
            )
            summary = summarize(files)
            row = {
                "prompt": name,
                "run": index,
                "ok": result.ok,
                "model": result.model,
                "inputTokens": result.input_tokens,
                "outputTokens": result.output_tokens,
                "stopReason": result.stop_reason,
                "timeToFirstTokenSeconds": result.time_to_first_token_s,
                "durationSeconds": round(result.duration_s, 3),
                **{k: status[k] for k in ("lastFileClosed", "fileCut", "hitOutputCap", "openPath", "closedFiles")},
                "scaffoldUiKitShare": summary["scaffoldUiKitShare"],
                "estimatedTokensByCategory": summary["estimatedTokensByCategory"],
                "scaffoldUiKitTokens": summary["scaffoldUiKitTokens"],
                "estimatedSecondsSaved": summary["estimatedSecondsSaved"],
                "estimatedOutputUsdSaved": summary["estimatedOutputUsdSaved"],
                "fileCount": summary["fileCount"],
            }
            rows.append(row)
            out.write_text(json.dumps({"rows": rows}, indent=2), encoding="utf-8")
            print(json.dumps({k: row[k] for k in (
                "prompt", "run", "stopReason", "lastFileClosed", "fileCut",
                "outputTokens", "scaffoldUiKitShare", "fileCount",
            )}), flush=True)
    shares = [row["scaffoldUiKitShare"] for row in rows]
    seconds = [row["estimatedSecondsSaved"] for row in rows]
    dollars = [row["estimatedOutputUsdSaved"] for row in rows]
    summary = {
        "runs": len(rows),
        "meanScaffoldShare": round(sum(shares) / len(shares), 3) if shares else None,
        "meanSecondsSaved": round(sum(seconds) / len(seconds), 1) if seconds else None,
        "meanOutputUsdSaved": round(sum(dollars) / len(dollars), 4) if dollars else None,
    }
    payload = json.loads(out.read_text(encoding="utf-8"))
    payload["summary"] = summary
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(summary), flush=True)


if __name__ == "__main__":
    main()
