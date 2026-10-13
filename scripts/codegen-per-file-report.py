"""Print the per-file measurement numbers used in the go/no-go report."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVAL = json.loads((ROOT / "docs" / "codegen-metrics" / "per-file-eval.json").read_text(encoding="utf-8"))


def _p95(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, int(round(0.95 * (len(ordered) - 1)))))
    return round(ordered[index], 3)


def main() -> None:
    rows = EVAL.get("ab", {}).get("rows", [])
    print("ab apps", len(rows))
    by_lang: dict[str, list] = {}
    leaf = []
    for row in rows:
        by_lang.setdefault(row["language"], []).append(row)
        for call in row.get("calls", []):
            if call.get("role") == "leaf" or "haiku-5" in str(call.get("model") or ""):
                leaf.append(call)
    for language, group in by_lang.items():
        walls = [row["wallSeconds"] for row in group]
        costs = [row["costUsd"] for row in group]
        reads = [row.get("cacheReadTokens") or 0 for row in group]
        outs = []
        ins = []
        for row in group:
            for call in row.get("calls", []):
                outs.append(call.get("outputTokens") or 0)
                ins.append(call.get("inputTokens") or 0)
        print(language, "n", len(group), "wallP50", sorted(walls)[len(walls)//2], "wallP95", _p95(walls),
              "costMean", round(sum(costs)/len(costs), 4), "costMax", round(max(costs), 4),
              "cacheReadMean", int(sum(reads)/len(reads)), "outTokMean", int(sum(outs)/len(outs)) if outs else 0,
              "inTokMean", int(sum(ins)/len(ins)) if ins else 0,
              "mismatches", sum(row.get("mismatchCount") or 0 for row in group),
              "repairs", sum(row.get("repairs") or 0 for row in group))
    ok = [call for call in leaf if call.get("ok") and call.get("stopReason") != "max_tokens"]
    print("leafCalls", len(leaf), "leafPass", len(ok), "leafMaxTokens", sum(1 for call in leaf if call.get("stopReason") == "max_tokens"),
          "leafTtftP50", sorted(call.get("timeToFirstTokenSeconds") or 0 for call in leaf)[len(leaf)//2] if leaf else None)
    models = {}
    for call in leaf:
        models.setdefault(call.get("model"), 0)
        models[call.get("model")] += 1
    print("leafModels", models)
    scale = EVAL.get("scale", {})
    print("scale", {k: scale.get(k) for k in ("apps", "calls", "wallSeconds", "throttleRate", "throttled", "queueP95Seconds", "callP95Seconds", "appP95Seconds", "gateLimit")})
    quotas = EVAL.get("quotas", {})
    print("quotas", json.dumps(quotas)[:500])


if __name__ == "__main__":
    main()
