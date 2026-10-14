"""P6-S4: gate preview iframe proxy and session reads by tool membership."""
from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session
from terrarium_contracts import SessionEvent

from terrarium_api.models import SessionRecord, ToolRecord
from terrarium_api.session_log import SessionEventLog
from terrarium_api.tool_access import can_see_tool


async def _session_actor_id(log: SessionEventLog, session_id: str) -> str | None:
    actor = await log.load_actor_id(session_id)
    if actor:
        return actor
    from terrarium_api.session_log import stream_key

    messages = await log.redis.xrevrange(stream_key(session_id), count=50)
    for _message_id, fields in messages:
        raw_event = fields.get("json", fields.get(b"json"))
        if not raw_event:
            continue
        try:
            event = SessionEvent.model_validate_json(_as_str(raw_event))
        except Exception:
            continue
        if event.name == "session.created" and isinstance(event.payload, dict):
            actor = event.payload.get("actorId")
            if isinstance(actor, str) and actor.strip():
                return actor.strip()
    return None


async def can_access_session_preview(
    log: SessionEventLog,
    db: Session,
    session_id: str,
    user: dict[str, str],
) -> bool:
    session = db.get(SessionRecord, session_id)
    if session is not None:
        if session.owner_id == user["id"]:
            return True
        if session.tool_id:
            tool = db.get(ToolRecord, session.tool_id)
            if tool is not None and can_see_tool(tool, user, db):
                return True
    tool_id = await log.load_tool_id(session_id)
    if tool_id:
        tool = db.get(ToolRecord, tool_id)
        if tool is not None and can_see_tool(tool, user, db):
            return True
    actor = await _session_actor_id(log, session_id)
    if actor and actor == user["id"]:
        return True
    return False


async def require_preview_access(
    log: SessionEventLog,
    db: Session,
    session_id: str,
    user: dict[str, str] | None,
) -> None:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not await log.exists(session_id):
        raise HTTPException(status_code=404, detail="Unknown sessionId")
    if not await can_access_session_preview(log, db, session_id, user):
        raise HTTPException(status_code=403, detail="Forbidden")
