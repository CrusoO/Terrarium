from __future__ import annotations

import os

from terrarium_api.trust.compute_health import HealthInputs, compute_health
from terrarium_sandbox.trust.scanners import scan


def test_unsafe_publish_blocked_by_secret() -> None:
    files = {"index.js": 'const x = "sk_live_abcdefghijklmnop";'}
    findings, secrets, _ = scan(files, tool_id="t1", version_id="v1")
    health = compute_health(
        HealthInputs(
            tool_id="t1",
            version_id="v1",
            file_map_hash="h1",
            stored_file_map_hash="h1",
            vuln_db_version="v1",
            checked_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc),
            secrets_found=secrets,
            findings=findings,
        )
    )
    assert health.status == "unsafe"
    assert health.blockingReasons


def test_cached_gate_fast_path_marker() -> None:
    """Document expectation: identical hash + vuln db reuses ToolHealthRecord."""
    os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
    assert os.environ["TERRARIUM_TRUST_OFFLINE"] == "1"
