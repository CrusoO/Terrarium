import json
from pathlib import Path

p = json.loads(Path("docs/codegen-metrics/file-spike.json").read_text(encoding="utf-8"))
for level in p["levels"]:
    print("==", level["name"])
    for row in sorted(level["rows"], key=lambda item: item["path"]):
        slow = (row.get("timeToFirstTokenSeconds") or 0) > 8
        cut = row.get("stopReason") == "max_tokens"
        if slow or cut:
            print(
                row["path"],
                "ttft",
                row.get("timeToFirstTokenSeconds"),
                "dur",
                row["durationSeconds"],
                "out",
                row.get("outputTokens"),
                "stop",
                row.get("stopReason"),
            )
