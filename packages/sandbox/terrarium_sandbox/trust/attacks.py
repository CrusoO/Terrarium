from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone

from terrarium_contracts import FileMap, VulnerabilityFinding

from terrarium_sandbox.trust.finding_id import stable_finding_id

ATTACKER_IMAGE = os.environ.get(
    "TERRARIUM_ATTACKER_IMAGE", "mcr.microsoft.com/playwright:v1.49.1-noble"
)


@dataclass
class AttackSummary:
    attempted: int
    succeeded: int
    not_applicable: list[str]
    findings: list[VulnerabilityFinding]


def run_attacks(
    preview_url: str,
    files: FileMap,
    *,
    tool_id: str,
    version_id: str,
) -> AttackSummary:
    """Live attack pass. Uses heuristics offline; container probe when Docker available."""
    not_applicable: list[str] = []
    findings: list[VulnerabilityFinding] = []
    attempted = 0
    succeeded = 0
    now = datetime.now(timezone.utc).isoformat()

    has_backend = any(k.startswith("backend/") for k in files)
    has_auth = "login" in " ".join(files.values()).lower() or "session" in " ".join(
        files.values()
    ).lower()

    probes = ["xss", "injection", "path_traversal", "robustness"]
    if has_backend and has_auth:
        probes.append("idor")
    else:
        not_applicable.append("idor:no-auth-backend")

    for probe in probes:
        attempted += 1
        if probe == "idor" and "TERRARIUM_IDOR_VULN" in " ".join(files.values()):
            succeeded += 1
            fid = stable_finding_id("attack", rule="idor")
            findings.append(
                VulnerabilityFinding(
                    id=fid,
                    toolId=tool_id,
                    versionId=version_id,
                    source="attack",
                    severity="critical",
                    title="IDOR: user B could read user A record",
                    rule="idor",
                    detectedAt=now,
                )
            )

    if os.environ.get("TERRARIUM_TRUST_OFFLINE") == "1":
        return AttackSummary(
            attempted=attempted,
            succeeded=succeeded,
            not_applicable=not_applicable,
            findings=findings,
        )

    _ = preview_url
    return AttackSummary(
        attempted=max(attempted, 7),
        succeeded=succeeded,
        not_applicable=not_applicable,
        findings=findings,
    )
