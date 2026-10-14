"""Re-score the 9 regenerated apps. Truncation is a failed app, not a healthy one.

File bodies were not saved, so this cannot run vite. Every row already recorded
stop_reason=max_tokens with the last file unclosed. That is a failed validation.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "codegen-metrics" / "token-share-9.json"
OUT = ROOT / "docs" / "codegen-metrics" / "validation-nine.json"


def main() -> None:
    payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = []
    for row in payload["rows"]:
        truncated = bool(row.get("fileCut") or row.get("hitOutputCap") or row.get("stopReason") == "max_tokens")
        closed = bool(row.get("lastFileClosed"))
        rows.append(
            {
                "prompt": row.get("prompt"),
                "run": row.get("run"),
                "validation": "failed" if truncated or not closed else "unknown",
                "reason": "truncated at max_tokens; last file was not closed"
                if truncated or not closed
                else "stream closed its last file; body was not saved so vite was not run",
                "stopReason": row.get("stopReason"),
                "lastFileClosed": row.get("lastFileClosed"),
                "fileCut": row.get("fileCut"),
                "openPath": row.get("openPath"),
                "outputTokens": row.get("outputTokens"),
                "priorStreamOk": row.get("ok"),
            }
        )
    failed = sum(1 for row in rows if row["validation"] == "failed")
    summary = {
        "apps": len(rows),
        "failed": failed,
        "passed": len(rows) - failed,
        "note": "Stream ok is not a healthy preview. These runs never produced a closed file set.",
        "rows": rows,
    }
    OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"apps": len(rows), "failed": failed, "out": str(OUT)}))


if __name__ == "__main__":
    main()
