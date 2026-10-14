from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_api.models import Base, ToolRecord, ToolVersionRecord
from terrarium_api.trust.campaigns import run_fleet_campaigns


@pytest.mark.asyncio
async def test_one_advisory_batches_five_tools() -> None:
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    files = {
        "package.json": '{"dependencies":{"lodash":"4.17.20"}}',
        "index.html": "<!doctype html><html><body></body></html>",
    }
    for index in range(5):
        tool = ToolRecord(
            id=f"t{index}",
            owner_id="owner",
            name=f"App {index}",
            summary="s",
            status="running",
        )
        db.add(tool)
        db.flush()
        db.add(
            ToolVersionRecord(
                id=f"v{index}",
                tool_id=tool.id,
                version_number=1,
                prompt="p",
                summary="s",
                files=files,
                is_live=True,
            )
        )
    db.commit()
    campaigns = await run_fleet_campaigns(db)
    assert len(campaigns) == 1
    assert len(campaigns[0].toolIds) == 5
