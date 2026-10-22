from __future__ import annotations

import os

from terrarium_agents.acceptance import propose_acceptance_checks, translate_checks


def test_broken_button_script_fails_offline() -> None:
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    checks = propose_acceptance_checks("expense tracker", kind="new")
    files = {"src/App.jsx": '<button data-broken>Add</button>'}
    script = translate_checks(checks, files)
    from terrarium_sandbox.trust.checks import run_checks

    results = run_checks("http://example", script, check_ids=[c.id for c in checks])
    assert any(r.status == "failed" for r in results)
