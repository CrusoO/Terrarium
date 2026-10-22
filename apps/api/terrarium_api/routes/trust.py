from __future__ import annotations

import csv
import io
import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from terrarium_contracts import (
    AcceptanceCheck,
    LedgerResponse,
    PublishBlockedResponse,
    PublishToolRequest,
    PublishToolResponse,
    ToolHealth,
    ToolHealthResponse,
    WhatsAppLinkCodeResponse,
)
from terrarium_agents.acceptance import propose_acceptance_checks

from terrarium_api.auth.deps import get_current_user
from terrarium_api.db import get_db
from terrarium_api.models import LedgerEntryRecord, ToolHealthRecord, ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.routes.workspace import _require_visible, _tool_summary, _version_dto
from terrarium_api.tool_access import can_edit_tool, member_role
from terrarium_api.trust.gate import run_publish_check
from terrarium_api.trust.remediation import run_ladder
from terrarium_api.session_log import SessionEventLog

router = APIRouter()


def _redis(request: Request):
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(status_code=503, detail="Redis pool is not ready.")
    return redis


def _latest_health(db: Session, tool_id: str, version_id: str) -> ToolHealth | None:
    row = db.scalars(
        select(ToolHealthRecord)
        .where(ToolHealthRecord.tool_id == tool_id, ToolHealthRecord.version_id == version_id)
        .order_by(ToolHealthRecord.checked_at.desc())
        .limit(1)
    ).first()
    return ToolHealth.model_validate(row.payload) if row else None


def _get_version(db: Session, tool: ToolRecord, version_id: str) -> ToolVersionRecord:
    version = db.get(ToolVersionRecord, version_id)
    if version is None or version.tool_id != tool.id:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.get("/tools/{tool_id}/health", response_model=ToolHealthResponse)
def tool_health(
    tool_id: str,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> ToolHealthResponse:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    live = None
    draft = None
    live_version = next((v for v in reversed(tool.versions) if v.is_live), None)
    if live_version:
        live = _latest_health(db, tool.id, live_version.id)
    if tool.draft_version_id:
        draft = _latest_health(db, tool.id, tool.draft_version_id)
    return ToolHealthResponse(live=live, draft=draft)


@router.post("/tools/{tool_id}/versions/{version_id}/publish-check", response_model=ToolHealth)
async def publish_check(
    tool_id: str,
    version_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> ToolHealth:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    if not can_edit_tool(tool, user, db):
        raise HTTPException(status_code=403, detail="Forbidden")
    version = _get_version(db, tool, version_id)
    checks_raw = version.acceptance_checks or []
    checks = [AcceptanceCheck.model_validate(item) for item in checks_raw]
    if not checks:
        checks = propose_acceptance_checks(version.summary, kind="modify")
    preview_url = None
    if tool.latest_session_id:
        log = SessionEventLog(_redis(request))
        preview_url = await log.load_preview_url(tool.latest_session_id)
    from terrarium_api.trust.regression import merge_regression_checks

    regression = merge_regression_checks(db, tool, checks)

    async def emit(name: str, payload: dict) -> None:
        if tool.latest_session_id:
            from terrarium_api.events import make_event

            await log.append(make_event(name, tool.latest_session_id, payload))

    return await run_publish_check(
        db,
        tool,
        version,
        preview_url=preview_url,
        checks=checks,
        regression_checks=regression,
        emit=emit,
    )


@router.post("/tools/{tool_id}/publish", response_model=PublishToolResponse)
async def publish_tool(
    tool_id: str,
    body: PublishToolRequest,
    request: Request,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> PublishToolResponse:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    role = member_role(db, tool, user)
    if role not in ("owner", "editor"):
        raise HTTPException(status_code=403, detail="Only owner or editor can publish")
    version_id = body.versionId or tool.draft_version_id
    if not version_id:
        latest = tool.versions[-1] if tool.versions else None
        version_id = latest.id if latest else None
    if not version_id:
        raise HTTPException(status_code=409, detail="No version to publish")
    version = _get_version(db, tool, version_id)
    checks = [
        AcceptanceCheck.model_validate(item)
        for item in (version.acceptance_checks or [])
    ] or propose_acceptance_checks(version.summary, kind="modify")

    async def emit(_name: str, _payload: dict) -> None:
        return None

    health = await run_publish_check(db, tool, version, checks=checks, emit=emit)
    if health.status == "unsafe":
        raise HTTPException(
            status_code=409,
            detail=PublishBlockedResponse(blockingReasons=health.blockingReasons, health=health).model_dump(),
        )
    if health.status == "warning" and not body.acknowledgeWarnings:
        raise HTTPException(
            status_code=409,
            detail="Warnings require acknowledgeWarnings=true",
        )

    for other in tool.versions:
        other.is_live = False
    version.is_live = True
    tool.draft_version_id = None
    tool.status = "running"
    db.commit()
    db.refresh(tool)
    db.refresh(version)
    return PublishToolResponse(tool=_tool_summary(tool, user, db), version=_version_dto(version))


@router.post("/tools/{tool_id}/remediate", response_model=ToolHealth)
async def remediate_tool(
    tool_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> ToolHealth:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    if not can_edit_tool(tool, user, db):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not tool.draft_version_id:
        raise HTTPException(status_code=409, detail="No draft version")
    draft = _get_version(db, tool, tool.draft_version_id)
    health = await publish_check(tool_id, draft.id, request, db, user)
    from terrarium_sandbox.trust import scan

    findings, _, _ = scan(draft.files, tool_id=tool.id, version_id=draft.id)
    run_ladder(db, tool, draft, findings)
    return await publish_check(tool_id, draft.id, request, db, user)


@router.get("/tools/{tool_id}/ledger", response_model=LedgerResponse)
def tool_ledger(
    tool_id: str,
    format: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> LedgerResponse | StreamingResponse:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    rows = db.scalars(
        select(LedgerEntryRecord)
        .where(LedgerEntryRecord.tool_id == tool.id)
        .order_by(LedgerEntryRecord.created_at.desc())
    ).all()
    entries = [
        {
            "id": row.id,
            "toolId": tool.id,
            "at": row.created_at.isoformat(),
            "kind": row.kind,
            "findingId": row.finding_id,
            "detail": row.detail,
        }
        for row in rows
    ]
    if format == "csv":
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=["id", "toolId", "at", "kind", "findingId", "detail"])
        writer.writeheader()
        writer.writerows(entries)
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{tool.id}-ledger.csv"'},
        )
    from terrarium_contracts import LedgerEntry

    return LedgerResponse(entries=[LedgerEntry.model_validate(item) for item in entries])


@router.post("/settings/whatsapp/link-code", response_model=WhatsAppLinkCodeResponse)
def whatsapp_link_code(
    user: dict[str, str] = Depends(get_current_user),
) -> WhatsAppLinkCodeResponse:
    import os
    import random
    from datetime import timedelta

    import httpx

    code = f"{random.randint(0, 999999):06d}"
    expires = (utc_now() + timedelta(minutes=10)).isoformat()
    relay = os.environ.get("RELAY_URL", "").rstrip("/")
    token = (os.environ.get("WORKER_TOKENS") or "").split(",")[0].strip()
    if relay and token:
        try:
            httpx.post(
                f"{relay}/admin/link-codes",
                json={"actorId": user["id"], "code": code, "expiresAt": expires},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            ).raise_for_status()
        except httpx.HTTPError:
            pass
    return WhatsAppLinkCodeResponse(code=code, expiresAt=expires)


@router.get("/tools/{tool_id}/change-requests")
def list_change_requests(
    tool_id: str,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, list]:
    tool = _require_visible(db.get(ToolRecord, tool_id), user, db)
    rows = db.scalars(
        select(LedgerEntryRecord)
        .where(LedgerEntryRecord.tool_id == tool.id, LedgerEntryRecord.kind == "attempt")
        .limit(50)
    ).all()
    return {"requests": [{"id": row.id, "detail": row.detail, "at": row.created_at.isoformat()} for row in rows]}


@router.get("/security/campaigns")
def list_campaigns(
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> dict:
    from terrarium_api.models import RemediationCampaignRecord

    _ = user
    rows = db.scalars(select(RemediationCampaignRecord).order_by(RemediationCampaignRecord.created_at.desc())).all()
    return {"campaigns": [row.payload for row in rows]}
