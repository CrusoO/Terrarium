"""Assemble the immutable round-2 stage report from saved run and gate artifacts."""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METRICS = ROOT / "docs" / "codegen-metrics"


def load(name: str) -> dict:
    return json.loads((METRICS / name).read_text(encoding="utf-8"))


def wilson(successes: int, total: int) -> dict:
    z = 1.959963984540054
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    margin = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return {
        "successes": successes,
        "total": total,
        "rate": round(successes / total, 4),
        "wilson95": [round(center - margin, 4), round(center + margin, 4)],
    }


prompts = load("stage2-blind-prompts.json")
run = load("live-stage2-20-run.json")
gate = load("live-stage2-20-gate.json")
edit_gate = load("live-stage2-edits-gate.json")

first = run["report"]["results"][0]["perApp"]
gate_rows = gate["rows"]

# Human screenshot grading. This is deliberately stricter than the metadata gate:
# chart prompts need a chart, wizard prompts need steps, and requested domain fields
# must be visible. Missing screenshots fail.
human = {
    1: (False, "Bakery batches replaced requested custom cake orders/customer/flavor/payment fields."),
    2: (True, "Appointment manager matches the one-word request."),
    3: (True, "Coffee-cart sales fields and totals are visible."),
    4: (True, "Tailoring job, garment, due date, and finish status are visible."),
    5: (True, "Yoga class reservations and capacity fields are visible."),
    6: (True, "Dog-walk booking is represented; the booking intent was selected."),
    7: (False, "Monthly readings are cards; the requested chart is absent."),
    8: (False, "Supported landing prompt was routed to monolith and produced no gradeable screenshot."),
    9: (False, "Venue request is a CRUD list; the requested guided steps are absent."),
    10: (True, "Spanish taqueria order fields and paid state are visible."),
    11: (True, "Stylist/time/phone haircut booking fields are visible."),
    12: (True, "Car-wash bay state and completed-wash totals are visible."),
    13: (False, "Monthly sales cards replace the requested bookstore chart."),
    14: (False, "Member records replace the requested guided signup steps."),
    15: (True, "Recipe-test dish/date/score/change-note fields are visible."),
    16: (False, "Supported ceramics landing prompt was routed to monolith and produced no gradeable screenshot."),
    17: (True, "Tennis court/date/start-time reservations are visible."),
}

rows = []
for index in range(1, 18):
    prompt = prompts[index - 1]
    if index <= 15:
        app = first[index - 1]
        gate_row = gate_rows[index - 1]
        generation = app.get("wallSeconds")
    elif index == 16:
        app = {
            "slug": "ceramics-open-studio",
            "route": "monolith",
            "mapper": {"source": "fast-model", "confidence": 0.7, "archetype": "landing", "supported": False},
            "repairs": 0,
            "degraded": [],
            "tokens": {"input": 1630, "output": 6082, "cacheRead": 0},
            "costUsd": 0.097027,
        }
        gate_row = gate_rows[15]
        generation = None
    else:
        app = {
            "slug": "tennis-court-reservations",
            "route": "per-file",
            "mapper": {"source": "fast-model", "confidence": 0.95, "archetype": "booking", "supported": True},
            "repairs": 0,
            "degraded": [],
            "tokens": {"input": 2995, "output": 2472, "cacheRead": 10849},
            "costUsd": 0.01644,
        }
        gate_row = gate_rows[16]
        generation = None
    relevant, reason = human[index]
    interaction = bool(gate_row.get("interactionValidated"))
    build = bool(gate_row.get("buildOk"))
    console_clean = gate_row.get("errors") == []
    validated = relevant and interaction and build and console_clean
    rows.append({
        "id": prompt["id"],
        "prompt": prompt["prompt"],
        "expectedArchetype": prompt["expectedArchetype"],
        "messyKind": prompt["messyKind"],
        "slug": app["slug"],
        "route": app.get("route", "per-file"),
        "mapper": app.get("mapper"),
        "humanRelevance": relevant,
        "humanRelevanceReason": reason,
        "interaction": interaction,
        "buildTsc": build,
        "consoleClean": console_clean,
        "validated": validated,
        "repairs": app.get("repairs", 0),
        "degradedFiles": app.get("degraded", []),
        "tokens": app.get("tokens"),
        "costUsd": app.get("costUsd"),
        "generationSecondsLinux": generation,
        "gateInteractiveSecondsWindows": gate_row.get("gateInteractiveSeconds"),
        "gateValidatedSecondsWindows": gate_row.get("gateValidatedSeconds"),
        "timeToInteractiveMixedHosts": (
            round(generation + gate_row["gateInteractiveSeconds"], 3)
            if generation is not None and gate_row.get("gateInteractiveSeconds") is not None
            else None
        ),
        "timeToValidatedMixedHosts": (
            round(generation + gate_row["gateValidatedSeconds"], 3)
            if validated and generation is not None and gate_row.get("gateValidatedSeconds") is not None
            else None
        ),
        "consoleErrors": gate_row.get("errors"),
    })

unsupported = [
    {
        "id": "p18",
        "route": "monolith",
        "mapperConfidence": 0.92,
        "costUsd": 0.495522,
        "result": "failed",
        "error": "Unclosed peer-lobby file, then missing ./styles/global.css import.",
    },
    {
        "id": "p19",
        "route": "monolith",
        "mapperConfidence": 0.95,
        "costUsd": 0.496847,
        "result": "failed",
        "error": "Missing ../../styles/appshell.css import.",
    },
    {
        "id": "p20",
        "route": "monolith",
        "mapperConfidence": 0.05,
        "costUsd": 0.249312,
        "result": "spend-guard",
        "error": "SpendExceeded before the next call.",
    },
]

edits = []
edit_meta = [
    ("add field", 0.021767),
    ("change label", 0.019893),
    ("rename", 0.019329),
]
for index, gate_row in enumerate(edit_gate["rows"]):
    edits.append({
        "edit": edit_meta[index][0],
        "modelOutputRecorded": True,
        "interaction": bool(gate_row.get("interactionValidated")),
        "buildTsc": bool(gate_row.get("buildOk")),
        "validated": bool(gate_row.get("validated")),
        "costUsd": edit_meta[index][1],
        "consoleErrors": gate_row.get("errors"),
    })

validated_times = sorted(
    row["timeToValidatedMixedHosts"]
    for row in rows
    if row["timeToValidatedMixedHosts"] is not None
)
p95_index = max(0, math.ceil(0.95 * len(validated_times)) - 1)

report = {
    "preflight": {
        "initialCodeHash": "1217b02aa197638ae826506ce00594af5ba05591c2ff27a2c63b5c081322a109",
        "continuationCodeHash": "cc82f88e05b111ae5309952a8d36532fce53855473610f8f3529ec15c638f4b0",
        "scaffoldVersion": "3",
        "staleHashAbortVerified": True,
    },
    "supportedBlind": {
        "rates": {
            "humanRelevance": wilson(sum(row["humanRelevance"] for row in rows), 17),
            "interaction": wilson(sum(row["interaction"] for row in rows), 17),
            "buildTsc": wilson(sum(row["buildTsc"] for row in rows), 17),
            "consoleClean": wilson(sum(row["consoleClean"] for row in rows), 17),
            "validated": wilson(sum(row["validated"] for row in rows), 17),
            "appsWithDegradedFiles": wilson(sum(bool(row["degradedFiles"]) for row in rows), 17),
        },
        "rows": rows,
    },
    "unsupportedBlind": unsupported,
    "edits": {
        "planned": 10,
        "recorded": wilson(3, 10),
        "interaction": wilson(sum(item["interaction"] for item in edits), 10),
        "validated": wilson(sum(item["validated"] for item in edits), 10),
        "rows": edits,
        "notRun": 7,
        "stopReason": "$2 aggregate cap",
    },
    "variety": {
        "generatedPerFileApps": 15,
        "themes": 6,
        "layouts": 3,
        "icons": 12,
        "verdict": "Palette and icon variety improved, but composition remains the same shell/cards/forms in three scaffold layouts.",
        "screenshot": "canary-shots/stage2-blind-side-by-side.png",
    },
    "timing": {
        "generationHost": "Linux infra-api-1 container",
        "browserHost": "Windows host",
        "buildHost": "Linux Docker sandbox orchestrated from Windows",
        "p95ValidatedMixedHostsSeconds": validated_times[p95_index] if validated_times else None,
        "linuxStagingP95": None,
        "note": "This run cannot establish the Linux-staging latency bar.",
    },
    "cost": {
        "estimatedAppsUsd": 0.4278,
        "reservedEditsUsd": 0.075,
        "estimatedTotalUsd": 0.5028,
        "actualAppsUsd": 1.907543,
        "actualEditsUsd": 0.060989,
        "actualTotalUsd": 1.968532,
        "capUsd": 2.0,
    },
    "greenhouseRepairAnalysis": "greenhouse-repair-analysis.json",
}

(METRICS / "stage2-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report["supportedBlind"]["rates"], indent=2))
print(json.dumps(report["cost"], indent=2))
