from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from terrarium_api.models import Base, ToolRecord, ToolVersionRecord
from terrarium_api.trust.remediation import replace_package_allowed, run_ladder
from terrarium_contracts import VulnerabilityFinding


def test_replace_package_not_on_allowlist() -> None:
    assert replace_package_allowed("totally-made-up-package") is False


def test_patch_upgrade_fixes_lodash() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    tool = ToolRecord(id="t1", owner_id="u1", name="App", summary="s", status="running")
    draft = ToolVersionRecord(
        id="d1",
        tool_id="t1",
        version_number=2,
        prompt="p",
        summary="s",
        files={
            "package.json": '{"dependencies":{"lodash":"4.17.20"}}',
        },
        is_live=False,
    )
    db.add(tool)
    db.add(draft)
    db.commit()
    finding = VulnerabilityFinding(
        id="f1",
        toolId="t1",
        versionId="d1",
        source="osv",
        severity="high",
        title="lodash",
        packageName="lodash",
        fixedVersions=["4.17.21"],
        detectedAt="2026-01-01T00:00:00Z",
    )
    attempts = run_ladder(db, tool, draft, [finding])
    assert attempts[0].outcome == "fixed"
    assert "4.17.21" in draft.files["package.json"]
