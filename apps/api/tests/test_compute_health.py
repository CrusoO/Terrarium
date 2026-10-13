from __future__ import annotations

from datetime import datetime, timedelta, timezone

from terrarium_api.trust.compute_health import HealthInputs, compute_health
from terrarium_contracts import VulnerabilityFinding


def _finding(severity: str, fid: str = "f1") -> VulnerabilityFinding:
    return VulnerabilityFinding(
        id=fid,
        toolId="t1",
        versionId="v1",
        source="osv",
        severity=severity,  # type: ignore[arg-type]
        title="test",
        detectedAt="2026-01-01T00:00:00Z",
    )


def test_unsafe_on_failed_test() -> None:
    now = datetime.now(timezone.utc)
    health = compute_health(
        HealthInputs(
            tool_id="t1",
            version_id="v1",
            file_map_hash="abc",
            stored_file_map_hash="abc",
            vuln_db_version="v1",
            checked_at=now,
            now=now,
            tests_passed=4,
            tests_total=5,
            failed_check_ids=["c1"],
        )
    )
    assert health.status == "unsafe"
    assert health.blockingReasons


def test_warning_on_medium() -> None:
    now = datetime.now(timezone.utc)
    health = compute_health(
        HealthInputs(
            tool_id="t1",
            version_id="v1",
            file_map_hash="abc",
            stored_file_map_hash="abc",
            vuln_db_version="v1",
            checked_at=now,
            now=now,
            tests_passed=5,
            tests_total=5,
            findings=[_finding("medium")],
        )
    )
    assert health.status == "warning"


def test_stale_when_hash_changed() -> None:
    now = datetime.now(timezone.utc)
    health = compute_health(
        HealthInputs(
            tool_id="t1",
            version_id="v1",
            file_map_hash="new",
            stored_file_map_hash="old",
            vuln_db_version="v1",
            checked_at=now,
            now=now,
            tests_passed=5,
            tests_total=5,
        )
    )
    assert health.status == "stale"


def test_stale_when_old_check() -> None:
    now = datetime.now(timezone.utc)
    health = compute_health(
        HealthInputs(
            tool_id="t1",
            version_id="v1",
            file_map_hash="abc",
            stored_file_map_hash="abc",
            vuln_db_version="v1",
            checked_at=now - timedelta(hours=25),
            now=now,
            tests_passed=5,
            tests_total=5,
        )
    )
    assert health.status == "stale"
