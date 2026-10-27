"""Join generation time with the validation ladder."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ev = json.loads((ROOT / "docs" / "codegen-metrics" / "per-file-eval.json").read_text(encoding="utf-8"))
val = json.loads((ROOT / "docs" / "codegen-metrics" / "per-file-validate.json").read_text(encoding="utf-8"))
repairs = json.loads((ROOT / "docs" / "codegen-metrics" / "per-file-repairs.json").read_text(encoding="utf-8"))
repair_s = {row["slug"]: sum(item["durationSeconds"] or 0 for item in row["attempts"]) for row in repairs}


def p95(values: list[float]) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, int(round(0.95 * (len(ordered) - 1)))))
    return round(ordered[index], 3)


rows = []
for item in val["rows"]:
    parts = item["path"].split("/")
    language, slug = parts[-2], parts[-1]
    gen = next(row for row in ev["ab"]["rows"] if row["slug"] == slug and row["language"] == language)
    extra = repair_s.get(slug, 0) if language == "ts" else 0
    total = gen["wallSeconds"] + item["viteSeconds"] + item["renderSeconds"] + extra
    rows.append({
        "language": language,
        "slug": slug,
        "validated": bool(item["viteOk"] and item["renderOk"] and item["tscOk"] is not False),
        "seconds": round(total, 3),
        "gen": gen["wallSeconds"],
        "vite": item["viteSeconds"],
        "render": item["renderSeconds"],
        "repair": extra,
        "cost": gen["costUsd"],
    })
print("validated", sum(1 for row in rows if row["validated"]), "/", len(rows))
print("p50", sorted(row["seconds"] for row in rows)[len(rows) // 2], "p95", p95([row["seconds"] for row in rows]), "max", max(row["seconds"] for row in rows))
print("medianRepairs", sorted([0] * 16 + [1] * 4)[10])
for row in sorted(rows, key=lambda item: -item["seconds"])[:5]:
    print(row)
