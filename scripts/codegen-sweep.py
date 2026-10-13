"""Dry-run or staged live sweep.

Default is --dry-run: print estimated cost and call count, then exit.
Live stages run only with --live, and they stop on the first failing stage.
CODEGEN_LLM_MODE defaults to replay, which refuses a missing fixture.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.llm_fixtures import assert_repair_budget, llm_mode, spend_summary  # noqa: E402
from terrarium_agents.sweep import compare_cost, dry_run, run_staged  # noqa: E402

HASH_FILES = (
    ROOT / "scripts" / "codegen-sweep.py",
    ROOT / "scripts" / "codegen-stage2-edits.py",
    ROOT / "docs" / "codegen-metrics" / "stage2-blind-prompts.json",
    ROOT / "packages" / "agents" / "terrarium_agents" / "contract_v2.py",
    ROOT / "packages" / "agents" / "terrarium_agents" / "per_file.py",
    ROOT / "packages" / "agents" / "terrarium_agents" / "canary.py",
    ROOT / "packages" / "agents" / "terrarium_agents" / "llm_fixtures.py",
)


def code_hash() -> str:
    digest = hashlib.sha256()
    for path in HASH_FILES:
        digest.update(path.relative_to(ROOT).as_posix().encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def preflight(*, live: bool) -> dict:
    from terrarium_agents.contract_v2 import SCAFFOLD_VERSION

    actual_hash = code_hash()
    row = {"codeHash": actual_hash, "scaffoldVersion": SCAFFOLD_VERSION}
    print(json.dumps({"preflight": row}), flush=True)
    if live:
        expected_hash = os.environ.get("CODEGEN_EXPECTED_HASH", "")
        expected_scaffold = os.environ.get("CODEGEN_EXPECTED_SCAFFOLD_VERSION", "")
        if not expected_hash or not expected_scaffold:
            raise SystemExit("live preflight requires CODEGEN_EXPECTED_HASH and CODEGEN_EXPECTED_SCAFFOLD_VERSION")
        if actual_hash != expected_hash or SCAFFOLD_VERSION != expected_scaffold:
            raise SystemExit(
                f"live preflight mismatch: expected {expected_hash}/{expected_scaffold}, "
                f"got {actual_hash}/{SCAFFOLD_VERSION}"
            )
    return row


def _live_stage(count: int) -> dict:
    from terrarium_agents.canary import HOLDOUT, SUPPORTED_ARCHETYPES, classify
    from terrarium_agents.per_file import UnsupportedBlueprint, run_per_file

    prompt_file = os.environ.get("CODEGEN_STAGE_PROMPTS_FILE", "")
    if prompt_file:
        blob = json.loads(Path(prompt_file).read_text(encoding="utf-8"))
        override = [str(item["prompt"] if isinstance(item, dict) else item) for item in blob]
    else:
        override = [item.strip() for item in os.environ.get("CODEGEN_STAGE_PROMPTS", "").split("|") if item.strip()]
    prompts = override[:count] if override else [prompt for kind, prompt in HOLDOUT if kind in {"crud", "dashboard", "booking"}][:count]
    out = Path(os.environ["CODEGEN_STAGE_DIR"]) if os.environ.get("CODEGEN_STAGE_DIR") else None
    ok = True
    written: list[str] = []
    apps: list[dict] = []
    for index, prompt in enumerate(prompts, start=1):
        started = time.monotonic()
        decision = classify(prompt)
        unsupported = decision.archetype not in SUPPORTED_ARCHETYPES and not decision.low_confidence
        before_usd = float(spend_summary()["usd"])
        try:
            if unsupported:
                raise UnsupportedBlueprint({
                    "source": "classifier",
                    "confidence": decision.confidence,
                    "archetype": decision.archetype,
                    "supported": False,
                })
            outcome = run_per_file(prompt, live=True, language="ts")
        except UnsupportedBlueprint as routed:
            try:
                apps.append(_run_monolith(index, prompt, out, routed.mapper, started, before_usd))
            except Exception as exc:
                after = spend_summary()
                apps.append({
                    "slug": f"unsupported-{index:02d}-{routed.mapper.get('archetype', 'unknown')}",
                    "route": "monolith",
                    "supported": False,
                    "archetype": routed.mapper.get("archetype", "unknown"),
                    "mapper": routed.mapper,
                    "repairs": 0,
                    "degraded": [],
                    "wallSeconds": round(time.monotonic() - started, 3),
                    "costUsd": round(float(after["usd"]) - before_usd, 6),
                    "tokens": None,
                    "staticOk": False,
                    "calls": None,
                    "error": f"{type(exc).__name__}: {exc}",
                })
                ok = False
            continue
        wall = round(time.monotonic() - started, 3)
        if out is not None:
            dest = out / f"{index:02d}-{outcome.contract.spec.slug}"
            first = out / f"{index:02d}-{outcome.contract.spec.slug}-firstpass"
            for path, body in outcome.files.items():
                target = dest / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(body, encoding="utf-8")
            for path, body in (outcome.files_before_repair or outcome.files).items():
                target = first / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(body, encoding="utf-8")
            written.append(str(dest))
        apps.append({
            "slug": outcome.contract.spec.slug,
            "route": "per-file",
            "supported": True,
            "archetype": decision.archetype,
            "repairs": outcome.repairs,
            "staticOk": outcome.static_ok,
            "calls": len(outcome.calls),
            "degraded": outcome.degraded_files,
            "tscErrors": outcome.tsc_errors,
            "wallSeconds": wall,
            "firstModelFileSeconds": outcome.first_model_file_seconds,
            "tokens": {
                "input": sum(int(call.get("inputTokens") or 0) for call in outcome.calls),
                "output": sum(int(call.get("outputTokens") or 0) for call in outcome.calls),
                "cacheRead": outcome.cache_read_tokens,
            },
            "costUsd": outcome.cost_usd,
            "mapper": outcome.mapper,
            "repairLog": outcome.repair_log,
        })
        if not outcome.static_ok:
            ok = False
            break
    try:
        assert_repair_budget(2)
    except RuntimeError:
        ok = False
    return {"ok": ok, "apps": len(prompts), "written": written, "perApp": apps, "spend": spend_summary()}


def _run_monolith(
    index: int,
    prompt: str,
    out: Path | None,
    mapper: dict,
    started: float,
    before_usd: float,
) -> dict:
    from terrarium_agents.codegen import generate
    from terrarium_agents.canary import classify
    from terrarium_contracts import AgentJob, Intent

    decision = classify(prompt)
    result = generate(
        AgentJob(
            sessionId=f"stage2-unsupported-{index}",
            intent=Intent(kind="new", stack="react", summary=prompt[:80]),
            prompt=prompt,
        )
    )
    slug = f"unsupported-{index:02d}-{decision.archetype}"
    if out is not None:
        dest = out / f"{index:02d}-{slug}"
        for path, body in result.files.items():
            target = dest / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
    after = spend_summary()
    return {
        "slug": slug,
        "route": "monolith",
        "supported": False,
        "archetype": decision.archetype,
        "mapper": mapper,
        "repairs": 0,
        "degraded": [],
        "wallSeconds": round(time.monotonic() - started, 3),
        "costUsd": round(float(after["usd"]) - before_usd, 6),
        "tokens": None,
        "staticOk": True,
        "calls": None,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Run staged sweeps. Off unless passed.")
    parser.add_argument("--limit", type=int, default=0, help="Run only one stage of this size, then stop.")
    parser.add_argument("--model", choices=("haiku", "production"), default="haiku")
    parser.add_argument("--print-version", action="store_true")
    args = parser.parse_args()
    check = preflight(live=args.live)
    if args.print_version:
        return
    stages = (args.limit,) if args.limit else None
    plan = dry_run(model=args.model, stages=stages or (5, 20, 50))
    if not args.live:
        print(json.dumps(plan, indent=2))
        return
    if llm_mode() == "replay":
        raise SystemExit("refusing --live while CODEGEN_LLM_MODE=replay")
    import terrarium_agents.llm  # noqa: F401  — merge the TLS CA before any Bedrock client
    if args.model == "production":
        # Leaf Haiku 5.5, pages and repairs Haiku 4.5. Sonnet stays on the monolith path.
        os.environ["TERRARIUM_MODEL_LEAF"] = "eu.anthropic.claude-haiku-5-5"
        os.environ["TERRARIUM_MODEL_PAGE"] = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
        os.environ["TERRARIUM_MODEL_FAST"] = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
    report = run_staged(_live_stage, stages=stages or (5, 20, 50))
    estimated = next((stage["estimatedUsd"] for stage in plan["stages"]), 0)
    spend = spend_summary()
    cost = compare_cost(estimated, [])
    cost["actualUsd"] = round(spend["usd"], 4)
    cost["deltaUsd"] = round(spend["usd"] - estimated, 4)
    print(json.dumps({"plan": plan, "report": report, "spend": spend, "cost": cost}, indent=2))


if __name__ == "__main__":
    main()
