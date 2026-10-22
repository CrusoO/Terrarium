from __future__ import annotations

import os
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

def test_unsigned_webhook_rejected() -> None:
    os.environ.pop("RELAY_SKIP_SIGNATURE", None)
    os.environ["TWILIO_AUTH_TOKEN"] = "secret"
    os.environ["RELAY_SQLITE_PATH"] = str(Path(tempfile.gettempdir()) / "relay-test-unsigned.db")
    import terrarium_relay.main as relay_main

    relay_main._store = None
    client = TestClient(relay_main.app)
    response = client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM1", "From": "whatsapp:+1", "Body": "hello"},
    )
    assert response.status_code == 403


def test_signed_webhook_creates_request() -> None:
    os.environ["RELAY_SKIP_SIGNATURE"] = "1"
    os.environ["RELAY_SQLITE_PATH"] = str(Path(tempfile.gettempdir()) / f"relay-test-signed-{uuid4().hex}.db")
    import terrarium_relay.main as relay_main

    relay_main._store = None
    store = relay_main.get_store()
    with store._connect() as conn:
        conn.execute(
            "INSERT INTO channel_links (actor_id, channel, address, verified_at) VALUES (?, ?, ?, ?)",
            ("user-1", "whatsapp", "whatsapp:+1555", "2026-01-01T00:00:00Z"),
        )
    client = TestClient(relay_main.app)
    response = client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM2", "From": "whatsapp:+1555", "Body": "Add dark mode"},
    )
    assert response.status_code == 200
    replay = client.post(
        "/channels/whatsapp/webhook",
        data={"MessageSid": "SM2", "From": "whatsapp:+1555", "Body": "Add dark mode"},
    )
    assert replay.json()["status"] == "ignored"
