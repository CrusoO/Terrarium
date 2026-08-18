from __future__ import annotations

from uuid import uuid4

from arq.connections import ArqRedis
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from terrarium_contracts import CreateSessionRequest, CreateSessionResponse, DEV_USER

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog

router = APIRouter()


def _redis(request: Request) -> ArqRedis:
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(status_code=503, detail="Redis pool is not ready.")
    return redis


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(
    body: CreateSessionRequest, request: Request
) -> CreateSessionResponse:
    if not body.prompt.strip():
        raise HTTPException(status_code=422, detail="prompt must not be empty")

    redis = _redis(request)
    session_id = uuid4().hex
    log = SessionEventLog(redis)
    await log.append(
        make_event("session.created", session_id, {"actorId": DEV_USER})
    )
    job = await redis.enqueue_job(
        "run_stub_session",
        session_id,
        body.prompt,
        _job_id=f"session:{session_id}",
    )
    if job is None:
        raise HTTPException(status_code=503, detail="Could not enqueue the session job.")
    return CreateSessionResponse(sessionId=session_id)


@router.get("/sessions/{session_id}/events")
async def session_events(session_id: str, request: Request) -> StreamingResponse:
    redis = _redis(request)
    log = SessionEventLog(redis)
    if not await log.exists(session_id):
        raise HTTPException(status_code=404, detail="Unknown sessionId")

    last_id = request.headers.get("last-event-id") or "0-0"

    async def generate():
        async for item in log.iter_events(session_id, last_id=last_id):
            if await request.is_disconnected():
                break
            if item is None:
                yield ": keepalive\n\n"
                continue
            event_id, event = item
            yield f"id: {event_id}\ndata: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
