from __future__ import annotations

import json
import os
from contextlib import contextmanager
from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from terrarium_contracts import ChangeRequest

from terrarium_api import change_requests as cr
from terrarium_api.models import Base, ToolRecord, ToolVersionRecord
from terrarium_api.tool_access import ensure_owner_member


@pytest.fixture()
def relay_env():
    os.environ["RELAY_SKIP_SIGNATURE"] = "1"
    os.environ["WORKER_TOKENS"] = "test-token"
    os.environ["RELAY_SQLITE_PATH"] = str(Path(gettempdir()) / f"relay-e2e-{uuid4().hex}.db")
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    import terrarium_relay.main as relay_main

    relay_main._store = None
    yield TestClient(relay_main.app), relay_main.get_store()


@pytest.fixture()
def tool_db():
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
        auto_approve_tests=False,
    )
    db.add(tool)
    db.flush()
    ensure_owner_member(db, tool)
    db.add(
        ToolVersionRecord(
            id="v1",
            tool_id="t1",
            version_number=1,
            prompt="p",
            summary="s",
            files={"index.html": "<!doctype html><html><body></body></html>"},
            is_live=True,
        )
    )
    db.commit()
    yield db
    db.close()


def _relay_transport(relay_client: TestClient):
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        headers = dict(request.headers)
        auth = headers.get("authorization") or headers.get("Authorization")
        bearer = {"Authorization": auth} if auth else {"Authorization": "Bearer test-token"}
        if path == "/worker/commands/drain":
            out = relay_client.post("/worker/commands/drain", headers=bearer)
            return httpx.Response(out.status_code, json=out.json())
        if path == "/worker/requests/claim":
            out = relay_client.post("/worker/requests/claim", headers=bearer)
            if out.status_code == 204:
                return httpx.Response(204)
            return httpx.Response(200, json=out.json())
        if path.startswith("/worker/requests/") and request.method == "GET":
            rid = path.split("/")[-1]
            out = relay_client.get(f"/worker/requests/{rid}", headers=bearer)
            return httpx.Response(out.status_code, json=out.json() if out.content else None)
        if path.endswith("/status") and request.method == "POST":
            rid = path.split("/")[-2]
            body = json.loads(request.content)
            out = relay_client.post(f"/worker/requests/{rid}/status", headers=bearer, json=body)
            return httpx.Response(out.status_code, json=out.json())
        return httpx.Response(404)

    return httpx.MockTransport(handler)


@pytest.mark.asyncio
async def test_yes_build_publish_flow(relay_env, tool_db, monkeypatch) -> None:
    relay_client, store = relay_env
    with store._connect() as conn:
        conn.execute(
            "INSERT INTO channel_links (actor_id, channel, address, verified_at) VALUES (?, ?, ?, ?)",
            ("owner", "whatsapp", "whatsapp:+1555", "2026-01-01T00:00:00Z"),
        )

    created = relay_client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM-e2e-1", "From": "whatsapp:+1555", "Body": "Add dark mode to My App"},
    )
    assert created.status_code == 200
    with store._connect() as conn:
        request_id = str(conn.execute("SELECT id FROM change_requests").fetchone()["id"])

    @contextmanager
    def session_local():
        yield tool_db

    monkeypatch.setattr("terrarium_api.db.SessionLocal", session_local)

    transport = _relay_transport(relay_client)
    async with httpx.AsyncClient(transport=transport, base_url="http://relay.test") as http_client:
        headers = {"Authorization": "Bearer test-token"}
        claim = await http_client.post("/worker/requests/claim", headers=headers)
        await cr.process_change_request(
            http_client,
            "http://relay.test",
            headers,
            "worker-1",
            ChangeRequest.model_validate(claim.json()),
        )

    with store._connect() as conn:
        assert conn.execute("SELECT status FROM change_requests WHERE id = ?", (request_id,)).fetchone()[0] == (
            "awaiting_test_approval"
        )

    relay_client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM-e2e-2", "From": "whatsapp:+1555", "Body": "YES"},
    )
    async with httpx.AsyncClient(transport=transport, base_url="http://relay.test") as http_client:
        headers = {"Authorization": "Bearer test-token"}
        drained = await http_client.post("/worker/commands/drain", headers=headers)
        for item in drained.json()["items"]:
            await cr.process_whatsapp_command(
                http_client,
                "http://relay.test",
                headers,
                item["requestId"],
                item["command"],
            )

    with store._connect() as conn:
        assert conn.execute("SELECT status FROM change_requests WHERE id = ?", (request_id,)).fetchone()[0] == (
            "ready_for_review"
        )

    relay_client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM-e2e-3", "From": "whatsapp:+1555", "Body": "PUBLISH"},
    )
    async with httpx.AsyncClient(transport=transport, base_url="http://relay.test") as http_client:
        headers = {"Authorization": "Bearer test-token"}
        drained = await http_client.post("/worker/commands/drain", headers=headers)
        for item in drained.json()["items"]:
            await cr.process_whatsapp_command(
                http_client,
                "http://relay.test",
                headers,
                item["requestId"],
                item["command"],
            )

    with store._connect() as conn:
        assert conn.execute("SELECT status FROM change_requests WHERE id = ?", (request_id,)).fetchone()[0] == "published"
    tool = tool_db.get(ToolRecord, "t1")
    assert tool.draft_version_id is None
    assert sum(1 for v in tool.versions if v.is_live) == 1
