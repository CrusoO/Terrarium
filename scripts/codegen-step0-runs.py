from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

import httpx


API_BASE = os.environ.get("TERRARIUM_API_BASE", "http://127.0.0.1:3010").rstrip("/")
OUT_DIR = Path(os.environ.get("CODEGEN_METRICS_DIR") or "docs/codegen-metrics")
# Real Firebase ID token only — no API auth bypass. See docs/codegen-analysis.md.
AUTH_TOKEN = os.environ.get("TERRARIUM_TEST_TOKEN", "").strip()

# Detailed specs (input + output language) so intent can go ready without clarify.
PROMPTS = [
    (
        "sample-customer-order-tracker",
        "Build a customer/order tracker web app. Staff enter customer name, order items, "
        "pickup date, and payment status. Show a searchable order list, order detail panel, "
        "and a dashboard that displays daily totals. Use Vite React, in-memory mock data, "
        "no backend, web UI only. Go ahead and build it.",
    ),
    (
        "sample-ecommerce-catalogue",
        "Build an ecommerce catalogue web app. Shoppers browse a product grid, filter by "
        "category, open product detail, add items to a cart, and see a checkout summary "
        "output. Use Vite React, in-memory mock catalogue data, no backend, web UI only. "
        "Go ahead and build it.",
    ),
    (
        "sample-operations-dashboard",
        "Build an operations dashboard web app. Supervisors enter jobs/tasks with owners "
        "and due dates, update status chips, and the app displays reports plus overdue work. "
        "Use Vite React, in-memory mock data, no backend, web UI only. Go ahead and build it.",
    ),
]
FOLLOW_UP = "Add a status filter to the main list. Go ahead and build it."


def _run_quality(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Derive model-vs-fallback and time-to-first-file from SSE events."""
    source = "unknown"
    provider = None
    model = None
    first_file_at: float | None = None
    codegen_started_at: float | None = None
    for event in events:
        name = _event_name(event)
        payload = event.get("payload") or {}
        at = event.get("at")
        if name == "codegen.started":
            codegen_started_at = at
        if name == "codegen.completed":
            provider = payload.get("llmProvider") or payload.get("codegenProvider")
            model = payload.get("llmModel") or payload.get("codegenModel")
            message = str(payload.get("message") or "")
            if payload.get("llmOk") is False or "fallback" in message.lower():
                source = "fallback"
            elif payload.get("llmOk") is True or provider:
                source = "model-generated"
        if name == "preview.stream.file" and first_file_at is None:
            # Prefer real generated files over skeleton frames (incomplete skeletons set complete=False
            # and often rewrite index.html). Record first file after codegen.started when possible.
            if codegen_started_at is None or (at and at >= codegen_started_at):
                if payload.get("path") and payload.get("complete") is not False:
                    first_file_at = at
                elif payload.get("path") and "skeleton" not in str(payload.get("content") or "")[:80].lower():
                    # Tagged stream emits complete=False until end; still count first non-skeleton.
                    content = str(payload.get("content") or "")
                    if "data-build-stage" not in content and "Model generated preview loading" not in content:
                        first_file_at = at
    ttff = None
    # Wall clock from this script is in durationSeconds; TTFF from event timestamps if numeric/ISO.
    return {
        "generationSource": source,
        "llmProvider": provider,
        "llmModel": model,
        "timeToFirstFileEventAt": first_file_at,
    }


PROCEED_ANSWER = (
    "Go ahead and build it. Skip remaining questions. Use Vite + React, in-memory mock "
    "data (no backend), desktop-first English UI, and ship a working MVP preview now."
)


def _require_token() -> str:
    if AUTH_TOKEN:
        return AUTH_TOKEN
    raise SystemExit(
        "TERRARIUM_TEST_TOKEN is required. Export a Firebase ID token "
        "(see docs/codegen-analysis.md). This script does not bypass API auth."
    )


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_require_token()}",
        "Content-Type": "application/json",
    }


def _post_session(prompt: str, session_id: str | None = None) -> str:
    body: dict[str, Any] = {"prompt": prompt}
    if session_id:
        body["sessionId"] = session_id
    for attempt in range(8):
        response = httpx.post(
            f"{API_BASE}/sessions", json=body, headers=_headers(), timeout=30
        )
        if response.status_code == 409:
            time.sleep(0.75 * (attempt + 1))
            continue
        response.raise_for_status()
        return str(response.json()["sessionId"])
    response.raise_for_status()
    raise RuntimeError("unreachable")


def _event_name(event: dict[str, Any]) -> str:
    return str(event.get("type") or event.get("kind") or event.get("name") or "")


def _wait_for_terminal(
    session_id: str,
    *,
    timeout_s: int = 900,
    after_at: str | None = None,
) -> list[dict[str, Any]]:
    deadline = time.monotonic() + timeout_s
    events: list[dict[str, Any]] = []
    with httpx.stream(
        "GET", f"{API_BASE}/sessions/{session_id}/events", headers=_headers(), timeout=None
    ) as response:
        response.raise_for_status()
        buffer = ""
        for chunk in response.iter_text():
            if time.monotonic() > deadline:
                raise TimeoutError(f"Timed out waiting for {session_id}")
            buffer += chunk
            while "\n\n" in buffer:
                raw, buffer = buffer.split("\n\n", 1)
                data_lines = [
                    line.removeprefix("data:").strip()
                    for line in raw.splitlines()
                    if line.startswith("data:")
                ]
                if not data_lines:
                    continue
                event = json.loads("".join(data_lines))
                if after_at and str(event.get("at") or "") <= after_at:
                    continue
                events.append(event)
                name = _event_name(event)
                if name in {"preview.ready", "heal.exhausted", "sandbox.unhealthy"}:
                    return events
                if name == "intent.classified":
                    phase = (event.get("payload") or {}).get("phase")
                    if phase == "clarify":
                        return events
    return events


def _clarify_answer_prompt(event: dict[str, Any]) -> str:
    payload = event.get("payload") or {}
    questions = payload.get("questions") or []
    if isinstance(questions, list) and questions:
        lines = [PROCEED_ANSWER, "", "Answers:"]
        for index, question in enumerate(questions, start=1):
            lines.append(f"{index}. {question} — use sensible MVP defaults and proceed.")
        return "\n".join(lines)
    return PROCEED_ANSWER


def _run_until_preview(
    prompt: str,
    session_id: str | None = None,
    after_at: str | None = None,
) -> tuple[str, list[dict[str, Any]]]:
    all_events: list[dict[str, Any]] = []
    sid = _post_session(prompt, session_id=session_id)
    for _ in range(4):
        cursor = after_at if not all_events else str(all_events[-1].get("at") or "")
        events = _wait_for_terminal(sid, after_at=cursor or None)
        all_events.extend(events)
        if not events:
            break
        last = events[-1]
        name = _event_name(last)
        if name in {"preview.ready", "heal.exhausted", "sandbox.unhealthy"}:
            break
        if name == "intent.classified" and (last.get("payload") or {}).get("phase") == "clarify":
            time.sleep(1.0)
            sid = _post_session(_clarify_answer_prompt(last), session_id=sid)
            continue
        break
    return sid, all_events


def main() -> None:
    _require_token()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    runs: list[dict[str, Any]] = []
    follow_up_session: str | None = None
    follow_up_after: str | None = None
    only = {part.strip() for part in os.environ.get("CODEGEN_ONLY", "").split(",") if part.strip()}
    prompts = [item for item in PROMPTS if not only or item[0] in only]
    for label, prompt in prompts:
        started = time.monotonic()
        session_id, events = _run_until_preview(prompt)
        terminal = _event_name(events[-1]) if events else None
        if terminal == "preview.ready" and follow_up_session is None:
            follow_up_session = session_id
            follow_up_after = str(events[-1].get("at") or "") if events else None
        row = {
            "label": label,
            "sessionId": session_id,
            "prompt": prompt,
            "durationSeconds": round(time.monotonic() - started, 3),
            "terminalEvent": terminal,
            "eventCount": len(events),
            "scope": "web-flow-only",
            "clarified": any(
                _event_name(e) == "intent.classified"
                and (e.get("payload") or {}).get("phase") == "clarify"
                for e in events
            ),
            **_run_quality(events),
        }
        runs.append(row)
        print(json.dumps(row, indent=2, sort_keys=True), flush=True)

    if follow_up_session:
        started = time.monotonic()
        session_id, events = _run_until_preview(
            FOLLOW_UP,
            session_id=follow_up_session,
            after_at=follow_up_after,
        )
        files_changed: list[Any] = []
        for event in events:
            payload = event.get("payload") or {}
            if isinstance(payload.get("filesChanged"), list):
                files_changed = payload["filesChanged"]
        row = {
            "label": "follow-up-edit-status-filter",
            "sessionId": session_id,
            "prompt": FOLLOW_UP,
            "durationSeconds": round(time.monotonic() - started, 3),
            "terminalEvent": _event_name(events[-1]) if events else None,
            "eventCount": len(events),
            "filesRegeneratedOrChanged": files_changed,
            "scope": "web-flow-only",
        }
        runs.append(row)
        print(json.dumps(row, indent=2, sort_keys=True), flush=True)

    out = {
        "apiBase": API_BASE,
        "auth": "Bearer TERRARIUM_TEST_TOKEN (Firebase ID token; no API bypass)",
        "requires": "Run API/worker with CODEGEN_METRICS=1",
        "excludedFromBaseline": ["whatsapp", "pen-testing", "trust-attack-pass"],
        "runs": runs,
    }
    path = OUT_DIR / ("step4-rerun-summary.json" if only else "step0-run-summary.json")
    path.write_text(json.dumps(out, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps(out, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
