from __future__ import annotations

import os
from contextlib import contextmanager
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from terrarium_contracts import ChangeRequest

from terrarium_api.models import Base, ToolRecord, ToolVersionRecord
from terrarium_api.change_requests import process_change_request


def _request(**overrides) -> ChangeRequest:
    base = {
        "id": "cr-1",
        "channel": "whatsapp",
        "externalMessageId": "SM-1",
        "actorId": "owner",
        "toolId": "t1",
        "text": "Add dark mode",
        "status": "claimed",
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-01T00:00:00Z",
    }
    base.update(overrides)
    return ChangeRequest.model_validate(base)


@pytest.fixture()
def tool_db():
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    tool = ToolRecord(
        id="t1",
        owner_id="owner",
        name="My App",
        summary="demo",
        status="running",
        auto_approve_tests=True,
    )
    db.add(tool)
    db.flush()
    db.add(
        ToolVersionRecord(
            id="v1",
            tool_id="t1",
            version_number=1,
            prompt="p",
            summary="s",
            files={"index.html": "<!doctype html><html><body>ok</body></html>"},
            is_live=True,
        )
    )
    db.commit()
    yield db
    db.close()


@pytest.mark.asyncio
async def test_auto_approve_builds_draft_and_reports_ready(tool_db) -> None:
    client = AsyncMock()
    client.post = AsyncMock(return_value=MagicMock(status_code=200))

    @contextmanager
    def session_local():
        yield tool_db

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("terrarium_api.db.SessionLocal", session_local)
        await process_change_request(
            client,
            "http://relay.test",
            {"Authorization": "Bearer t"},
            "worker-1",
            _request(),
        )

    assert client.post.call_count >= 1
    payload = client.post.call_args.kwargs["json"]
    assert payload["status"] == "ready_for_review"
    assert "Ready" in payload["replyText"]
    assert tool_db.get(ToolRecord, "t1").draft_version_id is not None


@pytest.mark.asyncio
async def test_manual_test_approval_when_not_auto(tool_db) -> None:
    tool = tool_db.get(ToolRecord, "t1")
    tool.auto_approve_tests = False
    tool_db.commit()

    client = AsyncMock()
    client.post = AsyncMock(return_value=MagicMock(status_code=200))

    @contextmanager
    def session_local():
        yield tool_db

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("terrarium_api.db.SessionLocal", session_local)
        await process_change_request(
            client,
            "http://relay.test",
            {"Authorization": "Bearer t"},
            "worker-1",
            _request(),
        )

    payload = client.post.call_args.kwargs["json"]
    assert payload["status"] == "awaiting_test_approval"
    assert "YES" in payload["replyText"]
    assert payload.get("proposedChecks")
