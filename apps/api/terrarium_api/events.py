from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from terrarium_contracts import SessionEvent, SessionEventName


def utc_now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def make_event(
    name: SessionEventName,
    session_id: str,
    payload: dict[str, Any] | None = None,
) -> SessionEvent:
    return SessionEvent(name=name, sessionId=session_id, at=utc_now(), payload=payload)
