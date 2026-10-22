from __future__ import annotations

import os

from terrarium_contracts import AcceptanceCheck, Intent
from terrarium_sandbox.trust import run_checks

from terrarium_agents.acceptance import propose_acceptance_checks, translate_checks
from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog


async def ensure_intent_checks(intent: Intent, prompt: str) -> list[AcceptanceCheck]:
    if intent.acceptanceChecks:
        return intent.acceptanceChecks
    kind = "modify" if intent.kind == "modify" else "new"
    return propose_acceptance_checks(intent.summary or prompt, kind=kind)


async def run_session_acceptance_checks(
    log: SessionEventLog,
    session_id: str,
    preview_url: str,
    files: dict[str, str],
    checks: list[AcceptanceCheck],
) -> str | None:
    """Run checks; emit check.* events. Returns error logs if any check failed."""
    await log.append(make_event("check.started", session_id, {}))
    if os.environ.get("TERRARIUM_TRUST_OFFLINE", "").strip() == "1":
        os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    script = translate_checks(checks, files)
    results = run_checks(preview_url, script, check_ids=[c.id for c in checks])
    failed = [r for r in results if r.status == "failed"]
    for check in checks:
        result = next((r for r in results if r.checkId == check.id), None)
        status = result.status if result else "skipped"
        await log.append(
            make_event(
                "check.step",
                session_id,
                {"step": "tests", "status": status, "detail": check.description[:120]},
            )
        )
    if failed:
        lines = [f"Acceptance check {r.checkId} failed: {r.error or 'unknown'}" for r in failed]
        await log.append(
            make_event(
                "check.completed",
                session_id,
                {"health": {"status": "unsafe", "blockingReasons": lines}},
            )
        )
        return "\n".join(lines)
    await log.append(
        make_event("check.step", session_id, {"step": "tests", "status": "passed"})
    )
    return None
