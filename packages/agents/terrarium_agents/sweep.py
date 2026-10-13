"""Staged codegen sweeps. The default is a dry run that does not call Bedrock."""

from __future__ import annotations

import json
from typing import Callable

from terrarium_agents.llm_fixtures import estimate_usd, fixtures_root, llm_mode, spend_summary

STAGES = (5, 20, 50)
# Per-file production is Haiku. Sonnet is the monolith overlay only.
PRODUCTION_MIX = {
    "leaf": "eu.anthropic.claude-haiku-5-5",
    "page": "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    "repair": "eu.anthropic.claude-haiku-4-5-20251001-v1:0",
    "monolith": "anthropic.claude-sonnet-4-6",
}
REPAIR_MARGIN = 0.15
MEASURED_PER_APP_USD = 0.0186  # round-2 mapped live stage: $0.092942 / 5


def _records() -> list[dict]:
    folder = fixtures_root() / "records"
    if not folder.is_dir():
        return []
    rows = []
    for path in folder.glob("*.json"):
        try:
            rows.append(json.loads(path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            continue
    return rows


def _price(record: dict, model: str) -> float:
    chosen = record.get("model") if model == "production" else "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
    if model == "production" and record.get("role") in PRODUCTION_MIX:
        chosen = PRODUCTION_MIX[str(record.get("role"))]
    if model == "production" and record.get("role") == "leaf-batch":
        chosen = PRODUCTION_MIX["leaf"]
    return estimate_usd(
        str(chosen or model),
        record.get("inputTokens"),
        record.get("outputTokens"),
        record.get("cacheCreationInputTokens"),
        record.get("cacheReadInputTokens"),
    )


def dry_run(*, model: str = "haiku", stages: tuple[int, ...] = STAGES) -> dict:
    """Estimated cost and call count. Does not call the provider."""
    records = [record for record in _records() if record.get("role") != "monolith"]
    if model == "production":
        price_model = "production-mix"
        per_call = [_price(record, "production") for record in records] or [0.0]
    else:
        price_model = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
        per_call = [_price(record, price_model) for record in records] or [0.0]
    average = sum(per_call) / len(per_call)
    by_task: dict[str, dict] = {}
    for record, cost in zip(records, per_call):
        task = str(record.get("purpose") or "codegen")
        bucket = by_task.setdefault(task, {"calls": 0, "usd": 0.0})
        bucket["calls"] += 1
        bucket["usd"] += cost
    calls_per_app = 6
    manifest = fixtures_root() / "manifest.json"
    if manifest.is_file():
        blob = json.loads(manifest.read_text(encoding="utf-8"))
        apps = [app for app in blob.get("apps") or [] if not str(app.get("id", "")).startswith("monolith/")]
        if apps:
            calls_per_app = max(1, round(sum(app.get("calls") or 0 for app in apps) / len(apps)))
    planned = []
    for count in stages:
        calls = count * calls_per_app
        fixture_base = calls * average
        base = count * MEASURED_PER_APP_USD if model == "production" else fixture_base
        planned.append(
            {
                "stage": count,
                "calls": calls,
                "estimatedUsd": round(base * (1 + REPAIR_MARGIN), 4),
                "beforeRepairsUsd": round(base, 4),
                "repairMargin": REPAIR_MARGIN,
                "estimateSource": "measured-per-app-round-2" if model == "production" else "fixture-call-average",
                "measuredPerAppUsd": MEASURED_PER_APP_USD if model == "production" else None,
                "status": "dry-run",
            }
        )
    cache_read = sum(int(record.get("cacheReadInputTokens") or 0) for record in records)
    return {
        "dryRun": True,
        "mode": llm_mode(),
        "model": model,
        "priceModel": price_model,
        "fixtureCalls": len(records),
        "callsPerApp": calls_per_app,
        "averageUsd": round(average, 6),
        "stages": planned,
        "stop": "first failing stage",
        "rerecord": "only hashes that are not already on disk",
        "cacheReadTokens": cache_read,
        "byTask": {task: {"calls": bucket["calls"], "usd": round(bucket["usd"], 4)} for task, bucket in by_task.items()},
        "liveSpendUsd": 0.0,
        "productionMix": PRODUCTION_MIX,
        "repairMargin": REPAIR_MARGIN,
    }


def compare_cost(estimated_usd: float, usage: list[dict]) -> dict:
    """Estimated versus tokens x published price. Cost Explorer is not required."""
    actual = 0.0
    for record in usage:
        actual += estimate_usd(
            str(record.get("model") or ""),
            record.get("inputTokens"),
            record.get("outputTokens"),
            record.get("cacheCreationInputTokens"),
            record.get("cacheReadInputTokens"),
        )
    return {
        "estimatedUsd": round(estimated_usd, 4),
        "actualUsd": round(actual, 4),
        "deltaUsd": round(actual - estimated_usd, 4),
        "source": "usage-tokens-x-price",
    }


def run_staged(
    runner: Callable[[int], dict],
    *,
    stages: tuple[int, ...] = STAGES,
    dry_run_plan: bool = False,
) -> dict:
    """Run 5, then 20, then 50. Stop on the first stage that is not ok."""
    if dry_run_plan:
        plan = dry_run(stages=stages)
        plan["results"] = []
        return plan
    results = []
    for count in stages:
        outcome = runner(count)
        results.append({"stage": count, **outcome})
        if not outcome.get("ok", False):
            break
    summary = spend_summary()
    return {"dryRun": False, "results": results, "stopped": len(results) < len(stages), "spend": summary}
