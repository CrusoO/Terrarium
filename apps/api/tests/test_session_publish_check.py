from __future__ import annotations

import asyncio
import os
from unittest.mock import AsyncMock, MagicMock

import pytest

from terrarium_api.trust.session_gate import run_session_publish_check


@pytest.mark.asyncio
async def test_session_publish_check_emits_events() -> None:
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    log = MagicMock()
    log.load_acceptance_checks = AsyncMock(return_value=[])
    log.load_preview_url = AsyncMock(return_value="http://127.0.0.1/")
    log.append = AsyncMock()

    db = MagicMock()
    db.get.return_value = None
    db.add = MagicMock()
    db.commit = MagicMock()
    db.scalars = MagicMock(return_value=MagicMock(first=MagicMock(return_value=None)))

    health = await run_session_publish_check(
        log,
        "sess-1",
        db,
        None,
        {"package.json": "{}"},
        summary="Test",
        prompt="Test",
    )
    assert health.status in ("healthy", "warning", "unsafe", "stale", "checking")
    assert log.append.await_count >= 1
