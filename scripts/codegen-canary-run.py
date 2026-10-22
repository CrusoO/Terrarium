"""Canary measurements. The monolith stays the default.

CANARY_PHASE=security|stream|firstpass|edits|holdout|load20|load50
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts"), str(ROOT / "packages" / "sandbox")]
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.canary import HOLDOUT, archetype_of  # noqa: E402
from terrarium_agents.contract_v2 import SPECS  # noqa: E402
from terrarium_agents.llm import leaf_model  # noqa: E402
from terrarium_agents.llm_stream import stream_bedrock_text  # noqa: E402
from terrarium_agents.per_file import GATE, run_blueprint_edit, run_per_file  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics"
APPS = OUT / "canary-apps"
RAW = OUT / "canary-apps-raw"


def _write(folder: Path, files: dict[str, str]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def _security() -> dict:
    from terrarium_sandbox.trust.scanners import preboot_blocks_boot, scan

    outcome = run_per_file(SPECS[0].prompt, live=False, spec=SPECS[0])
    started = time.perf_counter()
    findings, secrets, issues = scan(outcome.files, tool_id="canary", version_id="canary")
    elapsed = time.perf_counter() - started
    return {
        "seconds": round(elapsed, 4),
        "findings": len(findings),
        "secrets": secrets,
        "issues": issues,
        "blocks": preboot_blocks_boot(findings, secrets),
        "packageFromScaffold": "vite" in outcome.files["package.json"] and "hacked" not in outcome.files["package.json"],
    }


def _stream() -> dict:
    started = time.perf_counter()
    result = stream_bedrock_text(
        "Reply with a short React component and nothing else.",
        "export default function Leaf() { return <p>Leaf</p> }\n",
        leaf_model(),
        max_tokens=200,
        purpose="canary-stream",
    )
    chunks = result.chunks
    first = chunks[0]["t"] if chunks else None
    last = chunks[-1]["t"] if chunks else None
    return {
        "model": result.model,
        "ok": result.ok,
        "failReason": result.fail_reason,
        "chunkCount": result.chunk_count,
        "firstTokenSeconds": result.time_to_first_token_s,
        "durationSeconds": round(result.duration_s, 3),
        "firstChunkSeconds": first,
        "lastChunkSeconds": last,
        "firstEqualsDuration": bool(first is not None and result.duration_s and abs(first - result.duration_s) < 0.05),
        "chunkTimes": [item["t"] for item in chunks[:12]],
        "wallSeconds": round(time.perf_counter() - started, 3),
    }


def _firstpass() -> list[dict]:
    rows = []
    for spec in SPECS:
        started = time.monotonic()
        outcome = run_per_file(spec.prompt, "jsdoc", live=True, spec=spec)
        wall = round(time.monotonic() - started, 3)
        _write(APPS / spec.slug, outcome.files)
        _write(RAW / spec.slug, outcome.pre_rewrite)
        row = outcome.public()
        row["wallSeconds"] = wall
        print(json.dumps({k: row[k] for k in ("slug", "wallSeconds", "firstPassMissing", "rewriteCount", "firstModelFileSeconds", "theme", "layout", "staticOk", "costUsd")}))
        rows.append(row)
    return rows


def _edits() -> list[dict]:
    spec = SPECS[0]
    base = run_per_file(spec.prompt, live=False, spec=spec).files
    # Prefer the live app written by firstpass when it exists.
    live_dir = APPS / spec.slug
    if (live_dir / "package.json").exists():
        base = {}
        for path in live_dir.rglob("*"):
            if path.is_file() and "node_modules" not in path.parts and path.suffix in {".js", ".jsx", ".css", ".html", ".json"}:
                base[path.relative_to(live_dir).as_posix()] = path.read_text(encoding="utf-8")
    plan = [
        ("add-field", {"name": "note", "type_name": "string", "sample": "Leave at door"}),
        ("rename", {"old": "city", "new": "town"}),
        ("new-filter", {"status": "Refunded"}),
        ("new-page", {"name": "Archive"}),
        ("add-field", {"name": "phone", "type_name": "string", "sample": "555-0100"}),
        ("rename", {"old": "customer", "new": "buyer"}),
        ("new-filter", {"status": "Held"}),
        ("add-field", {"name": "window", "type_name": "string", "sample": "Morning"}),
        ("new-page", {"name": "Pickup"}),
        ("new-filter", {"status": "Packed"}),
    ]
    rows = []
    current_spec = spec
    files = base
    for kind, kwargs in plan:
        started = time.monotonic()
        outcome = run_blueprint_edit(files, current_spec, kind, live=True, **kwargs)
        wall = round(time.monotonic() - started, 3)
        current_spec = outcome.contract.spec
        files = outcome.files
        changed = [path for path, body in files.items() if base.get(path) != body]
        rows.append({
            "kind": kind,
            "detail": kwargs,
            "wallSeconds": wall,
            "filesChanged": len(changed),
            "changed": changed,
            "modelCalls": len(outcome.calls),
            "packageUntouched": files["package.json"] == outcome.files["package.json"] and "vite" in files["package.json"],
        })
        print(json.dumps(rows[-1]))
        base = files
    _write(OUT / "canary-edit" / "orders", files)
    return rows


def _holdout() -> dict:
    groups: dict[str, list[dict]] = {}
    for expected, prompt in HOLDOUT:
        groups.setdefault(expected, [])
        if archetype_of(prompt) not in {"crud", "dashboard", "booking"}:
            groups[expected].append({"prompt": prompt, "routed": "monolith", "generated": False})
            continue
        started = time.monotonic()
        outcome = run_per_file(prompt, "jsdoc", live=True)
        wall = round(time.monotonic() - started, 3)
        slug = f"{expected}-{len(groups[expected]) + 1}"
        _write(OUT / "canary-holdout" / slug, outcome.files)
        groups[expected].append({
            "prompt": prompt,
            "routed": "per-file",
            "generated": True,
            "wallSeconds": wall,
            "staticOk": outcome.static_ok,
            "firstPassMissing": len(outcome.first_pass_missing),
            "slug": slug,
        })
        print(json.dumps(groups[expected][-1]))
    return {"groups": {name: rows for name, rows in groups.items()}}


def _load(count: int, spread_seconds: float, *, app_slots: int | None = None, gate_limit: int | None = None) -> dict:
    prompts = [prompt for _kind, prompt in HOLDOUT if archetype_of(prompt) in {"crud", "dashboard", "booking"}]
    if gate_limit:
        GATE.limit = gate_limit
        GATE.ceiling = max(GATE.ceiling, gate_limit)
    slots = threading.Semaphore(app_slots or count)
    started = time.monotonic()
    rows: list[dict] = []
    lock = threading.Lock()

    def _go(index: int) -> None:
        if spread_seconds:
            time.sleep(spread_seconds * index / max(1, count))
        queued = time.monotonic()
        slots.acquire()
        queue_wait = time.monotonic() - queued
        prompt = prompts[index % len(prompts)]
        row_started = time.monotonic()
        try:
            outcome = run_per_file(prompt, "jsdoc", live=True)
        finally:
            slots.release()
        row = {
            "index": index,
            "wallSeconds": round(time.monotonic() - row_started, 3),
            "queueWait": round(queue_wait, 3),
            "staticOk": outcome.static_ok,
            "queueP95": None,
        }
        queues = [call.get("queueSeconds") or 0 for call in outcome.calls]
        throttled = sum(1 for call in outcome.calls if call.get("throttled"))
        row["calls"] = len(outcome.calls)
        row["throttled"] = throttled
        row["queueMax"] = round(max(queues) if queues else 0, 3)
        with lock:
            rows.append(row)
            print(json.dumps(row))

    threads = [threading.Thread(target=_go, args=(index,)) for index in range(count)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    calls = sum(row["calls"] for row in rows)
    throttled = sum(row["throttled"] for row in rows)
    walls = sorted(row["wallSeconds"] for row in rows)
    queues = sorted(row["queueMax"] for row in rows)

    def _p95(values: list[float]) -> float:
        if not values:
            return 0
        return values[max(0, min(len(values) - 1, int(round(0.95 * (len(values) - 1)))))]

    return {
        "apps": len(rows),
        "calls": calls,
        "throttled": throttled,
        "throttleRate": round(throttled / calls, 4) if calls else 0,
        "wallSeconds": round(time.monotonic() - started, 3),
        "appP95": round(_p95(walls), 3),
        "queueP95": round(_p95(queues), 3),
        "appQueueP95": round(_p95(sorted(row["queueWait"] for row in rows)), 3),
        "gateLimit": GATE.limit,
        "appSlots": app_slots or count,
        "rows": rows,
    }


def main() -> None:
    phase = os.environ.get("CANARY_PHASE", "security")
    if phase == "security":
        payload = _security()
    elif phase == "stream":
        payload = _stream()
    elif phase == "firstpass":
        payload = {"rows": _firstpass()}
    elif phase == "edits":
        payload = {"rows": _edits()}
    elif phase == "holdout":
        payload = _holdout()
    elif phase == "load20":
        payload = _load(20, 0)
    elif phase == "load20b":
        payload = _load(20, 0, app_slots=8, gate_limit=32)
    elif phase == "load50":
        payload = _load(50, 300)
    else:
        raise SystemExit(f"unknown phase {phase}")
    target = OUT / "canary-eval.json"
    previous = json.loads(target.read_text(encoding="utf-8")) if target.exists() else {}
    previous[phase] = payload
    target.write_text(json.dumps(previous, indent=2), encoding="utf-8")
    print(json.dumps({"phase": phase, "wrote": str(target)}))


if __name__ == "__main__":
    main()
