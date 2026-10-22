"""Measure the five demo prompts through the real API the web UI calls.

Reads the Firebase token from TEMP. Does not print it.
Stops when the spend guard refuses a call.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

API = os.environ.get("TERRARIUM_API_BASE", "http://127.0.0.1:3010").rstrip("/")
TOKEN = (Path(os.environ.get("TEMP") or ".") / "terrarium-test-token").read_text(encoding="utf-8").strip()
OUT = Path("docs/codegen-metrics/demo-sprint-runs.json")
PROMPTS = [
    "Purchase order tracker with search, status filter (open, approved, received), add form, detail view and daily totals.",
    "Operations dashboard for failed integration messages: owners, status chips, overdue items, daily totals and a report view.",
    "Spare parts inventory with search, category filter, add form, detail view and stock totals.",
    "Equipment booking: book a device for a date and time, upcoming bookings, status filter, booking details.",
    "IT change request tracker with owner, system (Dev, QA, Prod), status and due date; search, status filter, add form and detail view.",
]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


def _name(event: dict) -> str:
    return str(event.get("name") or "")


def _wait(session_id: str, timeout_s: int = int(os.environ.get("DEMO_TIMEOUT_S", "240"))) -> list[dict]:
    events: list[dict] = []
    deadline = time.monotonic() + timeout_s
    with httpx.stream("GET", f"{API}/sessions/{session_id}/events", headers=HEADERS, timeout=None) as response:
        response.raise_for_status()
        buffer = ""
        for chunk in response.iter_text():
            if time.monotonic() > deadline:
                events.append({"name": "client.timeout", "payload": {}})
                return events
            buffer += chunk
            while "\n\n" in buffer:
                raw, buffer = buffer.split("\n\n", 1)
                data = "".join(
                    line.removeprefix("data:").strip() for line in raw.splitlines() if line.startswith("data:")
                )
                if not data:
                    continue
                event = json.loads(data)
                events.append(event)
                name = _name(event)
                payload = event.get("payload") or {}
                if name == "preview.ready":
                    return events
                if name == "sandbox.unhealthy" and payload.get("terminal"):
                    return events
                if name == "heal.exhausted":
                    return events
                if name == "intent.classified" and payload.get("phase") == "clarify":
                    return events
                message = str(payload.get("message") or payload.get("logs") or "")
                if "CODEGEN_MAX_SPEND_USD" in message or "would exceed" in message:
                    return events
    return events


def _summarize(prompt: str, run: int, events: list[dict], seconds: float) -> dict:
    names = [_name(event) for event in events]
    messages = []
    for event in events:
        payload = event.get("payload") or {}
        if isinstance(payload, dict) and payload.get("message"):
            messages.append(str(payload["message"])[:400])
    preview = "preview.ready" in names
    terminal = next((event for event in events if _name(event) == "sandbox.unhealthy" and (event.get("payload") or {}).get("terminal")), None)
    clarify = any(_name(event) == "intent.classified" and (event.get("payload") or {}).get("phase") == "clarify" for event in events)
    return {
        "prompt": prompt,
        "run": run,
        "seconds": round(seconds, 1),
        "events": names,
        "messages": messages,
        "previewReady": preview,
        "validated": preview and terminal is None,
        "clarify": clarify,
        "terminalMessage": ((terminal or {}).get("payload") or {}).get("message"),
    }


def main() -> None:
    limit = int(os.environ.get("DEMO_RUN_LIMIT", "15"))
    rows: list[dict] = []
    done = 0
    for prompt in PROMPTS:
        for run in range(1, 4):
            if done >= limit:
                break
            started = time.monotonic()
            created = httpx.post(f"{API}/sessions", headers=HEADERS, json={"prompt": prompt}, timeout=30)
            created.raise_for_status()
            session_id = created.json()["sessionId"]
            events = _wait(session_id)
            row = _summarize(prompt, run, events, time.monotonic() - started)
            row["sessionId"] = session_id
            rows.append(row)
            OUT.write_text(json.dumps(rows, indent=2), encoding="utf-8")
            print(json.dumps({k: row[k] for k in ("run", "seconds", "previewReady", "clarify", "terminalMessage", "events")}), flush=True)
            done += 1
            blob = json.dumps(row)
            if "would exceed" in blob or "CODEGEN_MAX_SPEND_USD" in blob:
                print(json.dumps({"stopped": "spend-guard"}))
                return
        else:
            continue
        break


if __name__ == "__main__":
    main()
