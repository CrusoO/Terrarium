from __future__ import annotations

from terrarium_contracts import AcceptanceCheck, ToolHealth

from terrarium_agents.acceptance import propose_acceptance_checks
from terrarium_api.events import make_event
from terrarium_api.models import ToolRecord, ToolVersionRecord
from terrarium_api.session_log import SessionEventLog
from terrarium_api.trust.drafts import upsert_draft_version
from terrarium_api.trust.gate import run_publish_check
from terrarium_api.trust.regression import merge_regression_checks


async def run_session_publish_check(
    log: SessionEventLog,
    session_id: str,
    db,
    tool: ToolRecord | None,
    files: dict[str, str],
    *,
    summary: str,
    prompt: str,
) -> ToolHealth:
    raw_checks = await log.load_acceptance_checks(session_id)
    checks = [AcceptanceCheck.model_validate(item) for item in raw_checks] if raw_checks else []
    if not checks:
        checks = propose_acceptance_checks(summary or prompt, kind="modify")
    preview_url = await log.load_preview_url(session_id)

    async def emit(name: str, payload: dict) -> None:
        await log.append(make_event(name, session_id, payload))

    if tool is not None:
        draft = upsert_draft_version(
            db, tool, files, prompt=prompt, summary=summary, new_checks=checks
        )
        regression = merge_regression_checks(db, tool, checks)
        return await run_publish_check(
            db,
            tool,
            draft,
            preview_url=preview_url,
            checks=checks,
            regression_checks=regression,
            emit=emit,
        )

    ephemeral_tool = ToolRecord(
        id=f"ephemeral-{session_id}",
        owner_id="ephemeral",
        name="Session draft",
        summary=summary,
        status="running",
    )
    version = ToolVersionRecord(
        id=session_id,
        tool_id=ephemeral_tool.id,
        version_number=1,
        prompt=prompt,
        summary=summary,
        files=files,
        is_live=False,
        acceptance_checks=[c.model_dump() for c in checks],
    )
    return await run_publish_check(
        db,
        ephemeral_tool,
        version,
        preview_url=preview_url,
        checks=checks,
        regression_checks=checks,
        emit=emit,
        persist_health=False,
        skip_cache=True,
    )
