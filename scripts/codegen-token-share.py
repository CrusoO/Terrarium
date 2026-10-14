"""Classify a Vite FileMap into scaffold vs app-specific tokens.

Scaffold + UI kit = config + layout/CSS + UI primitives.
Mock data and business logic stay model-generated.
Tokens are chars/4, labeled estimated.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

_PRIMITIVES = (
    "button",
    "badge",
    "modal",
    "shell",
    "navbar",
    "sidebar",
    "searchbar",
    "search",
    "card",
    "input",
    "icon",
    "statcard",
    "statusbadge",
    "appshell",
    "topbar",
    "layout",
)
# Output rate and price from the measured Sonnet 4.6 codegen calls.
TOKENS_PER_SECOND = 266.0
OUTPUT_USD_PER_MTOK = 15.0


def category(path: str) -> str:
    lower = path.replace("\\", "/").lower()
    name = Path(lower).name
    stem = Path(lower).stem.replace("_", "").replace("-", "")
    if lower.endswith((".css", ".scss")):
        return "layout-css"
    if name in {"package.json", "vite.config.js", "vite.config.ts", "index.html"} or name in {
        "main.jsx",
        "main.tsx",
    }:
        return "config"
    if "/data/" in lower or re.search(r"(seed|mock|fixture)", name):
        return "mock-data"
    if any(token in stem for token in _PRIMITIVES):
        return "ui-primitives"
    return "business-logic"


def summarize(files: dict[str, str]) -> dict:
    buckets: dict[str, int] = {}
    per_file = []
    for path, content in sorted(files.items()):
        tokens = max(1, round(len(content) / 4))
        kind = category(path)
        buckets[kind] = buckets.get(kind, 0) + tokens
        per_file.append({"path": path, "category": kind, "estimatedTokens": tokens})
    total = sum(buckets.values()) or 1
    removable = buckets.get("config", 0) + buckets.get("layout-css", 0) + buckets.get("ui-primitives", 0)
    share = removable / total
    return {
        "fileCount": len(files),
        "estimatedTokensByCategory": buckets,
        "estimatedTotalTokens": total,
        "scaffoldUiKitTokens": removable,
        "scaffoldUiKitShare": round(share, 3),
        "estimatedSecondsSaved": round(removable / TOKENS_PER_SECOND, 1),
        "estimatedOutputUsdSaved": round(removable / 1_000_000 * OUTPUT_USD_PER_MTOK, 4),
        "files": per_file,
    }


def main() -> None:
    import os
    import redis

    client = redis.Redis(
        host=os.environ.get("REDIS_HOST", "127.0.0.1"),
        port=int(os.environ.get("REDIS_PORT", "6380")),
        decode_responses=True,
    )
    session_id = os.environ.get("TOKEN_SHARE_SESSION", "e4594a9540e549ce938a6c4c12d4b2b6")
    raw = client.get(f"terrarium:session:{session_id}:files")
    if not raw:
        raise SystemExit(f"no filemap for {session_id}")
    summary = summarize(json.loads(raw))
    summary["sessionId"] = session_id
    summary["tokenEstimate"] = "chars/4"
    path = Path("docs/codegen-metrics/token-share.json")
    path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({k: summary[k] for k in summary if k != "files"}, indent=2))


if __name__ == "__main__":
    main()
