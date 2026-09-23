from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from uuid import uuid4

from arq.connections import ArqRedis
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from terrarium_contracts import (
    DEV_USER,
    AcceptMatchRequest,
    OpenToolResponse,
    PreviewReadyPayload,
    PublishToolRequest,
    PublishToolResponse,
    SandboxReadyPayload,
    ToolSummary,
    ToolVersion,
    WorkspaceToolsResponse,
)
from terrarium_sandbox import SandboxRunner

from terrarium_agents.smart_match import compute_prompt_fingerprint
from terrarium_api.db import get_db
from terrarium_api.events import make_event
from terrarium_api.models import SessionRecord, ToolIndexRecord, ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import IDLE_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)
router = APIRouter()


def _redis(request: Request) -> ArqRedis:
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(status_code=503, detail="Redis pool is not ready.")
    return redis


def _iso(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _latest_version(tool: ToolRecord) -> ToolVersionRecord | None:
    return tool.versions[-1] if tool.versions else None


def _tool_summary(tool: ToolRecord) -> ToolSummary:
    latest = _latest_version(tool)
    return ToolSummary(
        id=tool.id,
        ownerId=tool.owner_id,
        name=tool.name,
        summary=tool.summary,
        status=tool.status,  # type: ignore[arg-type]
        createdAt=_iso(tool.created_at),
        updatedAt=_iso(tool.updated_at),
        latestVersionId=latest.id if latest else None,
        latestSessionId=tool.latest_session_id,
        fileCount=len(latest.files) if latest else 0,
    )


def _version_dto(version: ToolVersionRecord) -> ToolVersion:
    return ToolVersion(
        id=version.id,
        toolId=version.tool_id,
        versionNumber=version.version_number,
        prompt=version.prompt,
        summary=version.summary,
        fileCount=len(version.files),
        createdAt=_iso(version.created_at),
    )


def _user_prompts(turns: list[dict[str, str]]) -> list[str]:
    return [turn["text"] for turn in turns if turn.get("role") == "user" and turn.get("text")]


def _original_prompt(turns: list[dict[str, str]]) -> str:
    prompts = _user_prompts(turns)
    return prompts[0] if prompts else ""


def _default_name(prompt: str) -> str:
    cleaned = " ".join(prompt.split())
    if not cleaned:
        return "Untitled Terrarium app"
    return cleaned[:80].rstrip(" .,;:-") or "Untitled Terrarium app"


def _sleep_idle_tools(db: Session) -> None:
    if IDLE_TIMEOUT_SECONDS <= 0:
        return
    now = utc_now()
    changed = False
    for tool in db.scalars(select(ToolRecord).where(ToolRecord.status == "running")).all():
        elapsed = (now - tool.updated_at).total_seconds()
        if elapsed < IDLE_TIMEOUT_SECONDS:
            continue
        if tool.latest_session_id:
            try:
                SandboxRunner().stop(tool.latest_session_id)
            except Exception:
                pass
        tool.status = "sleeping"
        tool.updated_at = now
        changed = True
    if changed:
        db.commit()


async def _boot_published_session(
    redis: ArqRedis,
    db: Session,
    tool: ToolRecord,
    files: dict[str, str],
) -> OpenToolResponse:
    session_id = uuid4().hex
    log = SessionEventLog(redis)
    await log.append(make_event("session.created", session_id, {"actorId": DEV_USER, "toolId": tool.id}))
    await log.save_files(session_id, files)
    await log.save_tool_id(session_id, tool.id)
    handle = await asyncio.to_thread(SandboxRunner().start, session_id, files)
    await log.append(
        make_event(
            "sandbox.ready",
            session_id,
            SandboxReadyPayload(previewUrl=handle.previewUrl, containerId=handle.containerId).model_dump(),
        )
    )
    await log.append(
        make_event(
            "preview.ready",
            session_id,
            PreviewReadyPayload(previewUrl=handle.previewUrl).model_dump(),
        )
    )
    db.add(
        SessionRecord(
            id=session_id,
            owner_id=DEV_USER,
            tool_id=tool.id,
            status="running",
        )
    )
    tool.status = "running"
    tool.latest_session_id = session_id
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(tool)
    return OpenToolResponse(sessionId=session_id, previewUrl=handle.previewUrl, tool=_tool_summary(tool))


@router.get("/workspace/tools", response_model=WorkspaceToolsResponse)
async def list_workspace_tools(db: Session = Depends(get_db)) -> WorkspaceToolsResponse:
    _sleep_idle_tools(db)
    tools = db.scalars(
        select(ToolRecord)
        .where(ToolRecord.owner_id == DEV_USER)
        .order_by(ToolRecord.updated_at.desc())
    ).all()
    return WorkspaceToolsResponse(tools=[_tool_summary(tool) for tool in tools])


@router.post("/sessions/{session_id}/publish", response_model=PublishToolResponse)
async def publish_session(
    session_id: str,
    body: PublishToolRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> PublishToolResponse:
    redis = _redis(request)
    log = SessionEventLog(redis)
    if not await log.exists(session_id):
        raise HTTPException(status_code=404, detail="Unknown sessionId")
    files = await log.load_files(session_id)
    if not files:
        raise HTTPException(status_code=409, detail="No FileMap is available to publish.")
    turns = await log.load_conversation(session_id)
    prompt = _original_prompt(turns)
    tool_id = await log.load_tool_id(session_id)
    tool = db.get(ToolRecord, tool_id) if tool_id else None
    if tool is None:
        tool = ToolRecord(
            id=uuid4().hex,
            owner_id=DEV_USER,
            name=(body.name or _default_name(prompt)).strip(),
            summary=(body.summary or prompt or "Published Terrarium app").strip()[:500],
            status="running",
            latest_session_id=session_id,
        )
        db.add(tool)
        db.flush()
        await log.save_tool_id(session_id, tool.id)
    else:
        tool.name = (body.name or tool.name).strip()
        tool.summary = (body.summary or tool.summary).strip()[:500]
        tool.status = "running"
        tool.latest_session_id = session_id
        tool.updated_at = utc_now()
    version = ToolVersionRecord(
        id=uuid4().hex,
        tool_id=tool.id,
        version_number=len(tool.versions) + 1,
        prompt=prompt,
        summary=tool.summary,
        files=files,
    )
    db.add(version)
    session = db.get(SessionRecord, session_id)
    if session:
        session.tool_id = tool.id
        session.status = "running"
        session.updated_at = utc_now()
    
    # P5-S1: Write/update tool index record for Smart Match
    # Compute deterministic fingerprint for exact matching
    intent = await log.load_intent(session_id)
    stack = intent.get("stack", "react") if intent else "react"
    fingerprint = compute_prompt_fingerprint(prompt, stack)  # type: ignore[arg-type]
    
    index_record = db.get(ToolIndexRecord, tool.id)
    if index_record:
        index_record.stack = stack
        index_record.summary = tool.summary
        index_record.prompt_fingerprint = fingerprint
        index_record.updated_at = utc_now()
    else:
        index_record = ToolIndexRecord(
            tool_id=tool.id,
            stack=stack,
            summary=tool.summary,
            prompt_fingerprint=fingerprint,
        )
        db.add(index_record)
    
    db.commit()
    db.refresh(tool)
    db.refresh(version)
    return PublishToolResponse(tool=_tool_summary(tool), version=_version_dto(version))


@router.post("/workspace/tools/{tool_id}/open", response_model=OpenToolResponse)
async def open_tool(
    tool_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> OpenToolResponse:
    tool = db.get(ToolRecord, tool_id)
    if tool is None or tool.owner_id != DEV_USER:
        raise HTTPException(status_code=404, detail="Tool not found")
    latest = _latest_version(tool)
    if latest is None:
        raise HTTPException(status_code=409, detail="Tool has no published versions.")
    return await _boot_published_session(_redis(request), db, tool, latest.files)


@router.post("/workspace/tools/{tool_id}/wake", response_model=OpenToolResponse)
async def wake_tool(
    tool_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> OpenToolResponse:
    return await open_tool(tool_id, request, db)


@router.post("/workspace/tools/{tool_id}/sleep", response_model=ToolSummary)
async def sleep_tool(tool_id: str, db: Session = Depends(get_db)) -> ToolSummary:
    tool = db.get(ToolRecord, tool_id)
    if tool is None or tool.owner_id != DEV_USER:
        raise HTTPException(status_code=404, detail="Tool not found")
    if tool.latest_session_id:
        await asyncio.to_thread(SandboxRunner().stop, tool.latest_session_id)
    tool.status = "sleeping"
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(tool)
    return _tool_summary(tool)


@router.post("/sessions/{session_id}/accept-match", response_model=OpenToolResponse)
async def accept_match(
    session_id: str,
    body: AcceptMatchRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> OpenToolResponse:
    """
    P5-S4: User accepts a Smart Match hit. Load the matched tool's FileMap
    into the sandbox (Editor path) and skip Code Generator.
    
    Acceptance criteria:
    - Does not emit codegen.started
    - FileMap from published version is loaded
    - Sandbox boots and preview.ready fires
    - Further prompts use Editor (kind=modify, toolId set)
    """
    redis = _redis(request)
    log = SessionEventLog(redis)
    
    if not await log.exists(session_id):
        raise HTTPException(status_code=404, detail="Unknown sessionId")
    
    # Validate that the session had a Smart Match hit
    # (In production, you might want to check a flag in Redis)
    
    tool = db.get(ToolRecord, body.toolId)
    if tool is None or tool.owner_id != DEV_USER:
        raise HTTPException(status_code=404, detail="Tool not found or not accessible")
    
    latest = _latest_version(tool)
    if latest is None:
        raise HTTPException(status_code=409, detail="Tool has no published versions")
    
    files = latest.files
    if not files:
        raise HTTPException(status_code=409, detail="Tool has no FileMap")
    
    # Save FileMap and toolId to the session
    await log.save_files(session_id, files)
    await log.save_tool_id(session_id, tool.id)
    
    # Update intent to modify mode for future prompts
    intent_payload = await log.load_intent(session_id)
    if intent_payload:
        intent_payload["kind"] = "modify"
        intent_payload["toolId"] = tool.id
        await log.save_intent(session_id, intent_payload)
    
    # Boot the sandbox with the matched FileMap
    handle = await asyncio.to_thread(SandboxRunner().start, session_id, files)
    await log.append(
        make_event(
            "sandbox.ready",
            session_id,
            SandboxReadyPayload(previewUrl=handle.previewUrl, containerId=handle.containerId).model_dump(),
        )
    )
    await log.append(
        make_event(
            "preview.ready",
            session_id,
            PreviewReadyPayload(previewUrl=handle.previewUrl).model_dump(),
        )
    )
    
    # Update or create session record
    session = db.get(SessionRecord, session_id)
    if session:
        session.tool_id = tool.id
        session.status = "running"
        session.updated_at = utc_now()
    else:
        db.add(
            SessionRecord(
                id=session_id,
                owner_id=DEV_USER,
                tool_id=tool.id,
                status="running",
            )
        )
    
    tool.status = "running"
    tool.latest_session_id = session_id
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(tool)
    
    logger.info(
        "Smart Match accepted for session %s: loaded toolId=%s with %d files",
        session_id,
        tool.id,
        len(files),
    )
    
    return OpenToolResponse(
        sessionId=session_id,
        previewUrl=handle.previewUrl,
        tool=_tool_summary(tool),
    )
