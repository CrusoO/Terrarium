from __future__ import annotations

import os
import time

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from terrarium_api.models import Base, ToolRecord, ToolVersionRecord
from terrarium_api.trust.gate import run_publish_check


@pytest.fixture()
def db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    session = factory()
    tool = ToolRecord(id="t1", owner_id="u1", name="App", summary="s", status="running")
    version = ToolVersionRecord(
        id="v1",
        tool_id="t1",
        version_number=1,
        prompt="p",
        summary="s",
        files={"package.json": "{}"},
        is_live=False,
    )
    session.add(tool)
    session.add(version)
    session.commit()
    yield session
    session.close()


def test_publish_check_cache_is_fast(db: Session) -> None:
    import asyncio

    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    tool = db.get(ToolRecord, "t1")
    version = db.get(ToolVersionRecord, "v1")
    assert tool and version

    async def run() -> None:
        first = await run_publish_check(db, tool, version, checks=[], skip_cache=True)
        start = time.perf_counter()
        second = await run_publish_check(db, tool, version, checks=[])
        elapsed = time.perf_counter() - start
        assert second.status == first.status
        assert elapsed < 2.0

    asyncio.run(run())
