"""Promote a draft version to live after the publish gate (shared by HTTP and WhatsApp worker)."""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session
from terrarium_contracts import ToolHealth

from terrarium_api.models import ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.trust.gate import run_publish_check
from terrarium_api.trust.regression import merge_regression_checks
from terrarium_contracts import AcceptanceCheck


async def promote_draft_version(
    db: Session,
    tool: ToolRecord,
    *,
    acknowledge_warnings: bool = False,
    preview_url: str | None = None,
) -> ToolVersionRecord:
    draft_id = tool.draft_version_id
    if not draft_id:
        raise HTTPException(status_code=409, detail="No draft version to publish.")
    draft = db.get(ToolVersionRecord, draft_id)
    if draft is None or draft.tool_id != tool.id:
        raise HTTPException(status_code=409, detail="Draft version missing.")
    checks = [AcceptanceCheck.model_validate(item) for item in (draft.acceptance_checks or [])]
    regression = merge_regression_checks(db, tool, checks)
    health = await run_publish_check(
        db,
        tool,
        draft,
        preview_url=preview_url,
        checks=checks,
        regression_checks=regression,
        skip_cache=False,
    )
    if health.status == "unsafe":
        raise HTTPException(
            status_code=409,
            detail={"blockingReasons": health.blockingReasons, "health": health.model_dump()},
        )
    if health.status == "warning" and not acknowledge_warnings:
        raise HTTPException(status_code=409, detail="Warnings require acknowledgement.")
    return commit_live_version(db, tool, draft, health)


def commit_live_version(
    db: Session,
    tool: ToolRecord,
    draft: ToolVersionRecord,
    health: ToolHealth | None = None,
) -> ToolVersionRecord:
    _ = health
    for other in tool.versions:
        other.is_live = False
    draft.is_live = True
    tool.draft_version_id = None
    tool.status = "running"
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(draft)
    db.refresh(tool)
    return draft


def discard_draft(db: Session, tool: ToolRecord) -> None:
    draft_id = tool.draft_version_id
    if not draft_id:
        return
    draft = db.get(ToolVersionRecord, draft_id)
    tool.draft_version_id = None
    tool.updated_at = utc_now()
    if draft and not draft.is_live:
        db.delete(draft)
    db.commit()
