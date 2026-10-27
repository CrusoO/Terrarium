from __future__ import annotations

import os

from terrarium_sandbox.trust.attacks import run_attacks


def test_idor_planted() -> None:
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    files = {
        "backend/server.js": "login session TERRARIUM_IDOR_VULN",
        "frontend/App.jsx": "login",
    }
    summary = run_attacks("http://example", files, tool_id="t1", version_id="v1")
    assert summary.succeeded >= 1
    assert any(f.source == "attack" for f in summary.findings)


def test_clean_react_tool() -> None:
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    files = {"src/App.jsx": "export default () => <div>Hi</div>"}
    summary = run_attacks("http://example", files, tool_id="t1", version_id="v1")
    assert summary.attempted > 0
    assert summary.succeeded == 0
