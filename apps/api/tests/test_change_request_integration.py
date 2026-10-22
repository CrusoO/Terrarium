from __future__ import annotations

import os
from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_api.models import Base, ToolRecord, ToolMemberRecord, ToolVersionRecord
from terrarium_api.tool_access import ensure_owner_member


@pytest.fixture()
def relay_client():
    os.environ["RELAY_SKIP_SIGNATURE"] = "1"
    os.environ["WORKER_TOKENS"] = "test-token"
    os.environ["RELAY_SQLITE_PATH"] = str(Path(gettempdir()) / f"relay-int-{uuid4().hex}.db")
    import terrarium_relay.main as relay_main

    relay_main._store = None
    return TestClient(relay_main.app), relay_main.get_store()


def test_viewer_change_request_never_claimed_for_build(relay_client) -> None:
    client, store = relay_client
    actor = "viewer-user"
    with store._connect() as conn:
        conn.execute(
            "INSERT INTO channel_links (actor_id, channel, address, verified_at) VALUES (?, ?, ?, ?)",
            (actor, "whatsapp", "whatsapp:+1999", "2026-01-01T00:00:00Z"),
        )
    response = client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM-int-1", "From": "whatsapp:+1999", "Body": "Add dark mode to My App"},
    )
    assert response.status_code == 200
    claimed = client.post("/worker/requests/claim", headers={"Authorization": "Bearer test-token"})
    assert claimed.status_code == 200
    body = claimed.json()
    assert body["text"]
    assert body["status"] in ("claimed", "queued")


def test_member_role_ignores_empty_email_match() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    tool = ToolRecord(id="t0", owner_id="owner", name="App", summary="s", status="running")
    db.add(tool)
    db.commit()
    from terrarium_api.tool_access import member_role

    assert member_role(db, tool, {"id": "stranger"}) is None


def test_db_viewer_role_blocks_edit() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    tool = ToolRecord(id="t1", owner_id="owner", name="App", summary="s", status="running")
    db.add(tool)
    db.flush()
    ensure_owner_member(db, tool)
    db.add(
        ToolMemberRecord(
            id="m1",
            tool_id="t1",
            user_id="viewer-user",
            role="viewer",
        )
    )
    db.add(
        ToolVersionRecord(
            id="v1",
            tool_id="t1",
            version_number=1,
            prompt="p",
            summary="s",
            files={"src/App.jsx": "export default () => null"},
            is_live=True,
        )
    )
    db.commit()
    from terrarium_api.tool_access import member_role

    assert member_role(db, tool, {"id": "viewer-user"}) == "viewer"
