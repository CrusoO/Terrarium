from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session
from terrarium_contracts import (
    LedgerEntry,
    RemediationAttempt,
    RemediationStrategy,
    VulnerabilityFinding,
)

from terrarium_api.models import LedgerEntryRecord, ToolRecord, ToolVersionRecord, utc_now

_REPO_ROOT = Path(__file__).resolve().parents[4]
_POLICY_PATH = _REPO_ROOT / "config" / "remediation-policy.json"
_ALTERNATIVES_PATH = _REPO_ROOT / "config" / "package-alternatives.json"

MAX_ATTEMPTS = 3


def _write_ledger(db: Session, tool_id: str, kind: str, detail: str, finding_id: str | None = None) -> LedgerEntry:
    entry = LedgerEntryRecord(
        id=uuid4().hex,
        tool_id=tool_id,
        kind=kind,
        finding_id=finding_id,
        detail=detail,
        created_at=utc_now(),
    )
    db.add(entry)
    db.flush()
    return LedgerEntry(
        id=entry.id,
        toolId=tool_id,
        at=entry.created_at.isoformat(),
        kind=kind,  # type: ignore[arg-type]
        findingId=finding_id,
        detail=detail,
    )


def patch_upgrade(files: dict[str, str], finding: VulnerabilityFinding) -> dict[str, str] | None:
    if not finding.packageName or not finding.fixedVersions:
        return None
    target = finding.fixedVersions[0]
    updated = dict(files)
    for path in ("package.json", "frontend/package.json", "backend/package.json"):
        if path not in updated:
            continue
        try:
            manifest = json.loads(updated[path])
        except json.JSONDecodeError:
            continue
        for section in ("dependencies", "devDependencies"):
            deps = manifest.get(section) or {}
            if finding.packageName in deps:
                deps[finding.packageName] = target
                manifest[section] = deps
        updated[path] = json.dumps(manifest, indent=2) + "\n"
    return updated


def replace_package_allowed(name: str) -> bool:
    try:
        alts = json.loads(_ALTERNATIVES_PATH.read_text(encoding="utf-8"))
    except OSError:
        return False
    for alternatives in alts.values():
        if name in alternatives:
            return True
    return False


def run_ladder(
    db: Session,
    tool: ToolRecord,
    draft: ToolVersionRecord,
    findings: list[VulnerabilityFinding],
) -> list[RemediationAttempt]:
    """Try strategies in order until one succeeds or attempts exhaust."""
    attempts: list[RemediationAttempt] = []
    blocking = [f for f in findings if f.severity in ("high", "critical")]
    files = dict(draft.files)

    for finding in blocking:
        for attempt_no in range(1, MAX_ATTEMPTS + 1):
            strategy: RemediationStrategy = "patch_upgrade"
            if finding.severity == "critical" and not finding.fixedVersions:
                strategy = "contain"
            elif finding.source == "semgrep":
                strategy = "code_fix"
            outcome = "failed"
            patched = patch_upgrade(files, finding) if strategy == "patch_upgrade" else None
            if strategy == "replace_package":
                outcome = "needs_approval"
                _write_ledger(db, tool.id, "attempt", "replace_package refused — not on allowlist", finding.id)
                attempts.append(
                    RemediationAttempt(
                        findingId=finding.id,
                        strategy=strategy,
                        attempt=attempt_no,
                        outcome=outcome,
                    )
                )
                break
            if strategy == "contain":
                tool.visibility = "private"
                _write_ledger(db, tool.id, "contained", "Critical reachable finding — tool restricted", finding.id)
                attempts.append(
                    RemediationAttempt(
                        findingId=finding.id,
                        strategy=strategy,
                        attempt=attempt_no,
                        outcome="fixed",
                    )
                )
                break
            if patched:
                files = patched
                draft.files = files
                outcome = "fixed"
                _write_ledger(db, tool.id, "fixed", f"Patched {finding.packageName}", finding.id)
            else:
                _write_ledger(db, tool.id, "attempt", f"{strategy} failed", finding.id)
            attempts.append(
                RemediationAttempt(
                    findingId=finding.id,
                    strategy=strategy,
                    attempt=attempt_no,
                    draftVersionId=draft.id,
                    outcome=outcome,  # type: ignore[arg-type]
                )
            )
            if outcome == "fixed":
                break
    db.commit()
    return attempts
