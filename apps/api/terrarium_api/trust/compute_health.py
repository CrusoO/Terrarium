from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from terrarium_contracts import HealthStatus, ToolHealth, VulnerabilityFinding

_STALE_HOURS = 24


@dataclass(frozen=True)
class HealthInputs:
    tool_id: str
    version_id: str
    file_map_hash: str
    stored_file_map_hash: str | None
    vuln_db_version: str
    checked_at: datetime
    now: datetime | None = None
    tests_passed: int = 0
    tests_total: int = 0
    failed_check_ids: list[str] | None = None
    attacks_attempted: int = 0
    attacks_succeeded: int = 0
    attacks_not_applicable: list[str] | None = None
    secrets_found: int = 0
    code_issues: int = 0
    findings: list[VulnerabilityFinding] | None = None
    suppressed_finding_ids: set[str] | None = None
    active_suppressions: int = 0


def _counts(findings: list[VulnerabilityFinding], suppressed: set[str]) -> dict[str, int]:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for item in findings:
        if item.id in suppressed:
            continue
        counts[item.severity] = counts.get(item.severity, 0) + 1
    return counts  # type: ignore[return-value]


def compute_health(inputs: HealthInputs) -> ToolHealth:
    """Pure health computation used by the publish gate."""
    now = inputs.now or datetime.now(timezone.utc)
    suppressed = inputs.suppressed_finding_ids or set()
    findings = inputs.findings or []
    vuln_counts = _counts(findings, suppressed)
    failed_ids = list(inputs.failed_check_ids or [])

    blocking: list[str] = []
    warnings: list[str] = []

    if failed_ids:
        blocking.append(f"{len(failed_ids)} acceptance check(s) failed")
    if inputs.attacks_succeeded > 0:
        blocking.append(f"{inputs.attacks_succeeded} attack(s) succeeded against the preview")
    if inputs.secrets_found > 0:
        blocking.append(f"{inputs.secrets_found} secret(s) detected in source")
    if vuln_counts["critical"] > 0:
        blocking.append(f"{vuln_counts['critical']} critical finding(s)")
    if vuln_counts["high"] > 0:
        blocking.append(f"{vuln_counts['high']} high severity finding(s)")

    for item in findings:
        if item.id in suppressed:
            continue
        if item.severity in ("medium", "low"):
            warnings.append(f"{item.severity}: {item.title}")

    if inputs.active_suppressions > 0:
        warnings.append(f"{inputs.active_suppressions} active suppression(s)")

    age_hours = (now - inputs.checked_at).total_seconds() / 3600.0
    stale = (
        inputs.stored_file_map_hash is not None
        and inputs.stored_file_map_hash != inputs.file_map_hash
    ) or age_hours >= _STALE_HOURS

    if blocking:
        status: HealthStatus = "unsafe"
    elif stale:
        status = "stale"
    elif warnings or vuln_counts["medium"] or vuln_counts["low"]:
        status = "warning"
    else:
        status = "healthy"

    return ToolHealth(
        toolId=inputs.tool_id,
        versionId=inputs.version_id,
        fileMapHash=inputs.file_map_hash,
        vulnDbVersion=inputs.vuln_db_version,
        status=status,
        checkedAt=inputs.checked_at.isoformat(),
        tests={
            "passed": inputs.tests_passed,
            "total": inputs.tests_total,
            "failedIds": failed_ids,
        },
        attacks={
            "attempted": inputs.attacks_attempted,
            "succeeded": inputs.attacks_succeeded,
            "notApplicable": list(inputs.attacks_not_applicable or []),
        },
        vulnerabilities=vuln_counts,  # type: ignore[arg-type]
        secretsFound=inputs.secrets_found,
        codeIssues=inputs.code_issues,
        activeSuppressions=inputs.active_suppressions,
        blockingReasons=blocking,
        warnings=warnings,
    )
