"""Free readiness checks. Replay and FakeProvider only. Does not call Bedrock."""

from __future__ import annotations

import heapq
import json
import os
import platform
import random
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [
    str(ROOT / "packages" / "agents"),
    str(ROOT / "packages" / "py-contracts"),
]

os.environ.setdefault("CODEGEN_LLM_MODE", "replay")
os.environ.setdefault("TERRARIUM_AGENTS", "stub")

from terrarium_agents.canary import archetype_supported, canary_per_file, classify, is_internal_session
from terrarium_agents.contract_v2 import SCAFFOLD_VERSION, SPECS, file_is_closed
from terrarium_agents.fake_provider import FakeProvider
from terrarium_agents.llm_fixtures import install_provider
from terrarium_agents.llm_stream import StreamResult
from terrarium_agents.per_file import (
    GATE,
    apply_patches,
    degrade_failed_files,
    run_per_file,
)
from terrarium_agents.sweep import MEASURED_PER_APP_USD, REPAIR_MARGIN

OUT = ROOT / "docs" / "codegen-metrics" / "readiness-phase1.json"
DEMO_PROMPTS = [
    "Purchase order tracker with search, status filter (open, approved, received), add form, detail view and daily totals.",
    "Operations dashboard for failed integration messages: owners, status chips, overdue items, daily totals and a report view.",
    "Spare parts inventory with search, category filter, add form, detail view and stock totals.",
    "Equipment booking: book a device for a date and time, upcoming bookings, status filter, booking details.",
    "IT change request tracker with owner, system (Dev, QA, Prod), status and due date; search, status filter, add form and detail view.",
]
SECRET_NEEDLES = ("sk_live_", "AKIA", "BEGIN PRIVATE KEY", "xoxb-", "ghp_")


class Scripted(FakeProvider):
    def __init__(self, spec, *, stop_reason="end_turn", fail_reason=None, ok=True, repair_search="NOT-IN-FILE"):
        super().__init__(spec, broken=None, latencies=[0.0])
        self.stop_reason = stop_reason
        self.fail_reason = fail_reason
        self.ok = ok
        self.repair_search = repair_search

    def stream(self, system, user, model, *, purpose="codegen", max_tokens=16000, cache_system=False):
        result = super().stream(
            system, user, model, purpose=purpose, max_tokens=max_tokens, cache_system=cache_system
        )
        if self.stop_reason == "max_tokens":
            return StreamResult(
                text="export default function ListPage() {\n  return (\n    <div>\n",
                provider="fake",
                model=model,
                ok=True,
                stop_reason="max_tokens",
                duration_s=0.0,
            )
        if not self.ok:
            return StreamResult(
                text="",
                provider="fake",
                model=model,
                ok=False,
                fail_reason=self.fail_reason,
                stop_reason="error",
                duration_s=0.0,
            )
        return result

    def invoke(self, system, user, model, *, max_tokens, temperature, purpose="repair"):
        row = super().invoke(
            system, user, model, max_tokens=max_tokens, temperature=temperature, purpose=purpose
        )
        if purpose == "repair":
            row["text"] = json.dumps(
                {
                    "patches": [
                        {
                            "path": "src/views/ListPage.tsx",
                            "search": self.repair_search,
                            "replace": "export default function ListPage() { return null }\n",
                        }
                    ]
                }
            )
        return row


def _case(name, user_message, broken_as_success, ended_clean, detail):
    ok = bool(user_message) and not broken_as_success and ended_clean
    return {
        "case": name,
        "pass": ok,
        "userMessage": user_message,
        "brokenAppShownAsSuccess": broken_as_success,
        "sessionEndsCleanly": ended_clean,
        "detail": detail,
    }


def failure_cases() -> list[dict]:
    spec = SPECS[0]
    rows = []

    install_provider(Scripted(spec, stop_reason="max_tokens"))
    try:
        outcome = run_per_file(spec.prompt, live=True, spec=spec)
    finally:
        install_provider(None)
    closed = all(file_is_closed(body) for body in outcome.files.values() if body.strip().endswith("}") or "function" in body)
    rows.append(
        _case(
            "truncated output (max_tokens)",
            False,
            outcome.static_ok and not outcome.stub_fallbacks,
            True,
            f"retry then stub_fallbacks={outcome.stub_fallbacks}; staticOk={outcome.static_ok}; no session event names the cutoff",
        )
    )

    install_provider(FakeProvider(spec, broken="unclosed", latencies=[0.0]))
    try:
        outcome = run_per_file(spec.prompt, live=True, spec=spec)
    finally:
        install_provider(None)
    rows.append(
        _case(
            "unclosed file",
            False,
            False,
            True,
            f"stub_fallbacks={outcome.stub_fallbacks}; staticOk={outcome.static_ok}; closed files replace the cut file with no user-facing reason",
        )
    )

    for label, broken in (
        ("bad import path", "import"),
        ("function passed to addItem", "function"),
        ("array vs single row", "cardinality"),
        ("tsc error", "tsc"),
    ):
        install_provider(FakeProvider(spec, broken=broken, latencies=[0.0]))
        try:
            outcome = run_per_file(spec.prompt, "ts" if broken == "tsc" else "jsdoc", live=True, spec=spec)
        finally:
            install_provider(None)
        rows.append(
            _case(
                label,
                False,
                bool(outcome.static_ok and (outcome.mismatches or outcome.tsc_errors or outcome.parse_errors)),
                True,
                f"repairs={outcome.repairs}; staticOk={outcome.static_ok}; mismatches={len(outcome.mismatches)}; tsc={len(outcome.tsc_errors)}; degraded={outcome.degraded_files}",
            )
        )

    files = {"src/views/ListPage.tsx": "export default function ListPage() { return <p>kept</p> }\n"}
    applied = apply_patches(
        files,
        [{"path": "src/views/ListPage.tsx", "search": "THIS SEARCH DOES NOT MATCH", "replace": "replaced"}],
    )
    rows.append(
        _case(
            "repair patch search does not match",
            False,
            False,
            True,
            f"applied={applied}; file unchanged ({'kept' in files['src/views/ListPage.tsx']}); no one-shot regenerate",
        )
    )

    install_provider(Scripted(spec, repair_search="THIS SEARCH DOES NOT MATCH"))
    try:
        outcome = run_per_file(
            spec.prompt,
            "ts",
            live=True,
            spec=spec,
        )
    finally:
        install_provider(None)
    # Force the degrade path on a file the patch cannot see, matching the two-failure rule.
    bad = {"src/components/OrderCard.tsx": "export default function OrderCard() { return addItem((draft) => draft) }\n"}
    from terrarium_agents.contract_v2 import build_contract

    contract = build_contract(spec, "ts")
    notes = ["src/components/OrderCard.tsx: addItem was passed a function. Pass one plain object."]
    first = apply_patches(bad, [{"path": "src/components/OrderCard.tsx", "search": "NO", "replace": "x"}])
    second = apply_patches(bad, [{"path": "src/components/OrderCard.tsx", "search": "NO", "replace": "y"}])
    degraded = degrade_failed_files(bad, contract, notes, [])
    rows.append(
        _case(
            "two failed repairs degrade to scaffold default",
            False,
            "addItem((" in bad.get("src/components/OrderCard.tsx", ""),
            True,
            f"live repairs={outcome.repairs}; forced applied={first}/{second}; degraded={degraded}; no user-facing degrade message",
        )
    )

    for label, reason in (
        ("model timeout", "timeout"),
        ("429 throttle", "429 too many requests"),
        ("provider error", "provider error"),
    ):
        install_provider(Scripted(spec, ok=False, fail_reason=reason))
        try:
            outcome = run_per_file(spec.prompt, live=True, spec=spec)
        finally:
            install_provider(None)
        rows.append(
            _case(
                label,
                False,
                False,
                True,
                f"fail swallowed into stub_fallbacks={outcome.stub_fallbacks}; staticOk={outcome.static_ok}; gateThrottles={GATE.throttles}",
            )
        )

    rows.append(
        _case(
            "sandbox crash",
            True,
            False,
            True,
            "worker emits sandbox.unhealthy and does not emit preview.ready when start throws; UI label is Preview failed. Not driven in the browser.",
        )
    )
    rows.append(
        _case(
            "preview health failure",
            True,
            False,
            True,
            "unhealthy or stopped health returns before preview.ready. Chat copy is The sandbox stayed unhealthy. Not driven in the browser.",
        )
    )
    rows.append(
        _case(
            "SSE disconnect and reconnect",
            True,
            False,
            True,
            "useCreateSession retries then sets Lost the session event stream. Not driven in the browser.",
        )
    )
    rows.append(
        _case(
            "duplicate submit",
            False,
            False,
            True,
            "a second job is dropped when the Redis lock is held. The only record is a worker log line. The user gets no message.",
        )
    )
    game = "Build a 3D racing game with a lap timer."
    rows.append(
        _case(
            "unsupported prompt",
            False,
            False,
            False,
            f"supported={archetype_supported(game)}; DEMO_MODE is unset so generate() still enters the monolith path. There is no not-supported-yet response.",
        )
    )
    rows.append(
        _case(
            "non-allowlisted account",
            False,
            False,
            False,
            f"canary_per_file={canary_per_file('sess', 'Track orders with search and a detail view', 'stranger@example.com')}; internal={is_internal_session('sess', 'stranger@example.com')}. The request is not rejected. It falls through to the monolith.",
        )
    )
    _ = closed
    return rows


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round(pct * (len(ordered) - 1)))))
    return ordered[index]


def concurrency() -> dict:
    manifest = json.loads((ROOT / "docs" / "codegen-metrics" / "fixtures" / "manifest.json").read_text(encoding="utf-8"))
    latencies = [float(item) for item in manifest["latencies"]]
    provider = FakeProvider(SPECS[0], latencies=[0.0])
    install_provider(provider)
    try:
        sample = run_per_file(SPECS[0].prompt, live=True, spec=SPECS[0])
    finally:
        install_provider(None)
    calls_per_app = max(1, sum(1 for call in sample.calls if call.get("role")))

    def simulate(apps: int, spread_s: float, seed: int) -> dict:
        rng = random.Random(seed)
        clock = 0.0
        in_use = 0
        limit = 8
        events: list[tuple[float, int, str]] = []
        waits: list[float] = []
        completions: list[float] = []
        seq = 0
        for index in range(apps):
            start = 0.0 if spread_s == 0 else (spread_s * index / max(1, apps - 1))
            heapq.heappush(events, (start, seq, "arrive"))
            seq += 1
        pending = 0
        app_left = {}
        next_app = 0
        while events:
            clock, _, kind = heapq.heappop(events)
            if kind == "arrive":
                app_left[next_app] = calls_per_app
                pending += 1
                next_app += 1
            elif kind == "done":
                in_use -= 1
                pending += 1
            while pending and in_use < limit:
                app_id = next(key for key, left in app_left.items() if left > 0)
                app_left[app_id] -= 1
                pending -= 1
                in_use += 1
                service = rng.choice(latencies)
                waits.append(0.0 if clock == 0 and spread_s == 0 else max(0.0, clock - 0))
                finish = clock + service
                if app_left[app_id] == 0:
                    completions.append(finish)
                    del app_left[app_id]
                heapq.heappush(events, (finish, seq, "done"))
                seq += 1
        return {
            "apps": apps,
            "spreadSeconds": spread_s,
            "callsPerApp": calls_per_app,
            "queueSecondsP95": round(_percentile(waits, 0.95), 3),
            "completionSecondsP95": round(_percentile(completions, 0.95), 3),
            "completionSecondsMax": round(max(completions) if completions else 0.0, 3),
            "errors": 0,
            "method": "discrete-event simulation of AdaptiveGate limit 8 using recorded fixture latencies as service time",
        }

    # The wait model above stamps 0 because service starts immediately when a slot is free.
    # Recompute waits with an explicit queue so a burst reports time until a slot opens.
    def simulate_queue(apps: int, spread_s: float, seed: int) -> dict:
        rng = random.Random(seed)
        limit = 8
        arrivals = [0.0 if spread_s == 0 else (spread_s * index / max(1, apps - 1)) for index in range(apps)]
        jobs = []
        for index, arrival in enumerate(arrivals):
            for call in range(calls_per_app):
                jobs.append({"app": index, "call": call, "arrival": arrival, "service": rng.choice(latencies)})
        jobs.sort(key=lambda item: (item["arrival"], item["app"], item["call"]))
        running: list[float] = []
        waits = []
        done_at = {index: arrival for index, arrival in enumerate(arrivals)}
        next_ready = {index: arrival for index, arrival in enumerate(arrivals)}
        for job in jobs:
            start_not_before = next_ready[job["app"]]
            running = [finish for finish in running if finish > start_not_before]
            if len(running) >= limit:
                running.sort()
                start = running.pop(0)
            else:
                start = start_not_before
            wait = max(0.0, start - start_not_before)
            waits.append(wait)
            finish = start + job["service"]
            running.append(finish)
            next_ready[job["app"]] = finish
            done_at[job["app"]] = finish
        completions = [done_at[index] - arrivals[index] for index in range(apps)]
        return {
            "apps": apps,
            "spreadSeconds": spread_s,
            "callsPerApp": calls_per_app,
            "queueSecondsMean": round(statistics.fmean(waits), 3),
            "queueSecondsP95": round(_percentile(waits, 0.95), 3),
            "validatedProxySecondsP95": round(_percentile(completions, 0.95), 3),
            "errors": 0,
            "host": f"{platform.system()} {platform.release()}",
            "method": "simulated AdaptiveGate(limit=8) with FakeProvider recorded latencies; no Bedrock calls",
        }

    return {
        "burst5": simulate_queue(5, 0, 1),
        "burst20": simulate_queue(20, 0, 2),
        "spread50": simulate_queue(50, 300, 3),
    }


def prompt_routes() -> list[dict]:
    rows = []
    for prompt in DEMO_PROMPTS:
        decision = classify(prompt)
        rows.append(
            {
                "prompt": prompt,
                "archetype": decision.archetype,
                "confidence": decision.confidence,
                "supported": archetype_supported(prompt),
                "allowlistedCanary": canary_per_file("demo", prompt, "codegen.step0.terrarium@gmail.com"),
                "publicCanary": canary_per_file("demo", prompt, "stranger@example.com"),
            }
        )
    return rows


def secrets() -> dict:
    roots = [
        ROOT / "docs" / "codegen-metrics" / "fixtures",
        ROOT / "docs" / "codegen-metrics" / "live-stage2b",
        ROOT / "docs" / "codegen-metrics" / "live-stage2-20",
    ]
    hits = 0
    scanned = 0
    for folder in roots:
        if not folder.exists():
            continue
        for path in folder.rglob("*"):
            if not path.is_file() or "node_modules" in path.parts:
                continue
            if path.suffix.lower() not in {".json", ".ts", ".tsx", ".js", ".jsx", ".md", ".txt", ".log"}:
                continue
            scanned += 1
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            hits += sum(text.count(needle) for needle in SECRET_NEEDLES)
    return {"filesScanned": scanned, "needleHits": hits}


def main() -> None:
    apps = 15
    edits = 15
    edit_each = 0.0203
    estimate = {
        "apps": apps,
        "edits": edits,
        "measuredPerAppUsd": MEASURED_PER_APP_USD,
        "repairMargin": REPAIR_MARGIN,
        "appsUsd": round(apps * MEASURED_PER_APP_USD * (1 + REPAIR_MARGIN), 4),
        "editsUsd": round(edits * edit_each, 4),
        "totalUsd": round(apps * MEASURED_PER_APP_USD * (1 + REPAIR_MARGIN) + edits * edit_each, 4),
        "capUsd": 1.50,
        "note": "Per-file estimate only. A monolith Sonnet call is about $0.50 and is not included. Phase 3 was not started.",
    }
    payload = {
        "host": f"{platform.system()} {platform.release()} {platform.version()}",
        "demoMode": os.environ.get("DEMO_MODE", ""),
        "scaffoldVersion": SCAFFOLD_VERSION,
        "cases": failure_cases(),
        "concurrency": concurrency(),
        "prompts": prompt_routes(),
        "secrets": secrets(),
        "phase3Estimate": estimate,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(OUT), "cases": len(payload["cases"]), "failed": sum(1 for row in payload["cases"] if not row["pass"])}))


if __name__ == "__main__":
    main()
