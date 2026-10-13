from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_api.models import Base, SessionRecord, ToolMemberRecord, ToolRecord
from terrarium_api.preview_access import can_access_session_preview
from terrarium_api.session_log import SessionEventLog
from terrarium_api.tool_access import ensure_owner_member


@pytest.mark.asyncio
async def test_owner_can_access_preview() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    session_id = "sess1"
    db.add(SessionRecord(id=session_id, owner_id="owner", status="running"))
    db.commit()
    redis = AsyncMock()
    redis.get = AsyncMock(side_effect=lambda key: {"terrarium:session:sess1:actorId": b"owner"}.get(key))
    redis.xrevrange = AsyncMock(return_value=[])
    log = SessionEventLog(redis)
    assert await can_access_session_preview(log, db, session_id, {"id": "owner"})


@pytest.mark.asyncio
async def test_viewer_can_see_tool_session() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    tool = ToolRecord(id="t1", owner_id="owner", name="App", summary="s", status="running")
    db.add(tool)
    db.flush()
    ensure_owner_member(db, tool)
    db.add(ToolMemberRecord(id="m1", tool_id="t1", user_id="viewer", role="viewer"))
    db.add(SessionRecord(id="sess2", owner_id="owner", tool_id="t1", status="running"))
    db.commit()
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.xrevrange = AsyncMock(return_value=[])
    log = SessionEventLog(redis)
    assert await can_access_session_preview(log, db, "sess2", {"id": "viewer"})


@pytest.mark.asyncio
async def test_stranger_denied() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    db.add(SessionRecord(id="sess3", owner_id="owner", status="running"))
    db.commit()
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.xrevrange = AsyncMock(return_value=[])
    log = SessionEventLog(redis)
    assert not await can_access_session_preview(log, db, "sess3", {"id": "stranger"})
