from __future__ import annotations

import os
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from terrarium_contracts import AcceptanceCheck, CheckStep, ToolHealth, VulnerabilityFinding
from terrarium_sandbox.trust import preboot_blocks_boot, run_attacks, run_checks, scan, vuln_db_version

from terrarium_agents.acceptance import translate_checks
from terrarium_api.models import ToolHealthRecord, ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.trust.compute_health import HealthInputs, compute_health
from terrarium_api.trust.file_hash import file_map_hash

EmitFn = Callable[[str, dict[str, Any]], Awaitable[None]]


async def _emit(emit: EmitFn | None, name: str, payload: dict[str, Any]) -> None:
    if emit:
        await emit(name, payload)


def _offline() -> bool:
    return os.environ.get("TERRARIUM_TRUST_OFFLINE", "").strip() == "1"


async def run_publish_check(
    db: Session,
    tool: ToolRecord,
    version: ToolVersionRecord,
    *,
    preview_url: str | None = None,
    checks: list[AcceptanceCheck] | None = None,
    regression_checks: list[AcceptanceCheck] | None = None,
    emit: EmitFn | None = None,
    skip_cache: bool = False,
    persist_health: bool = True,
) -> ToolHealth:
    files = version.files
    fhash = file_map_hash(files)
    vdb = vuln_db_version()

    cached = db.scalars(
        select(ToolHealthRecord)
        .where(
            ToolHealthRecord.tool_id == tool.id,
            ToolHealthRecord.version_id == version.id,
            ToolHealthRecord.file_map_hash == fhash,
            ToolHealthRecord.vuln_db_version == vdb,
        )
        .order_by(ToolHealthRecord.checked_at.desc())
        .limit(1)
    ).first()
    if cached and not skip_cache:
        checked_at = cached.checked_at
        if checked_at.tzinfo is None:
            checked_at = checked_at.replace(tzinfo=timezone.utc)
        age = (utc_now() - checked_at).total_seconds()
        if age < 86400:
            health = ToolHealth.model_validate(cached.payload)
            await _emit(emit, "check.completed", {"health": health.model_dump()})
            return health

    await _emit(emit, "check.started", {})
    all_checks = checks or []
    regression = regression_checks or all_checks

    findings, secrets, code_issues = scan(files, tool_id=tool.id, version_id=version.id)
    check_results = []
    failed_ids: list[str] = []
    attacks_summary = None

    async def step(name: CheckStep, status: str, detail: str | None = None) -> None:
        payload: dict[str, Any] = {"step": name, "status": status}
        if detail:
            payload["detail"] = detail
        await _emit(emit, "check.step", payload)

    if preview_url and all_checks:
        await step("tests", "running")
        if _offline():
            os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
        script = translate_checks(all_checks, files)
        check_results = run_checks(preview_url, script, check_ids=[c.id for c in all_checks])
        failed_ids = [r.checkId for r in check_results if r.status == "failed"]
        await step("tests", "failed" if failed_ids else "passed", f"{len(failed_ids)} failed")
    else:
        await step("tests", "skipped", "No preview URL")

    if preview_url and regression:
        await step("regression", "running")
        if _offline():
            os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
        reg_script = translate_checks(regression, files)
        reg_results = run_checks(preview_url, reg_script, check_ids=[c.id for c in regression])
        reg_failed = [r.checkId for r in reg_results if r.status == "failed"]
        failed_ids = list(dict.fromkeys([*failed_ids, *reg_failed]))
        if not check_results:
            check_results = reg_results
        await step("regression", "failed" if reg_failed else "passed")
    else:
        await step("regression", "skipped")

    dep_count = sum(1 for f in findings if f.source == "osv")
    await step("dependencies", "failed" if dep_count and any(f.severity in ("high", "critical") for f in findings if f.source == "osv") else "passed")
    code_high = [f for f in findings if f.source == "semgrep" and f.severity in ("high", "critical")]
    await step("code", "failed" if code_high else "passed")
    await step("secrets", "failed" if secrets else "passed")
    await step("image", "skipped", "No image scan in dev")

    if preview_url:
        await step("attacks", "running")
        if _offline():
            os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
        attacks_summary = run_attacks(preview_url, files, tool_id=tool.id, version_id=version.id)
        findings.extend(attacks_summary.findings)
        await step("attacks", "failed" if attacks_summary.succeeded else "passed")
    else:
        await step("attacks", "skipped")

    passed = sum(1 for r in check_results if r.status == "passed")
    total = len(check_results) or len(all_checks)

    health = compute_health(
        HealthInputs(
            tool_id=tool.id,
            version_id=version.id,
            file_map_hash=fhash,
            stored_file_map_hash=fhash,
            vuln_db_version=vdb,
            checked_at=datetime.now(timezone.utc),
            tests_passed=passed,
            tests_total=total,
            failed_check_ids=failed_ids,
            attacks_attempted=attacks_summary.attempted if attacks_summary else 0,
            attacks_succeeded=attacks_summary.succeeded if attacks_summary else 0,
            attacks_not_applicable=attacks_summary.not_applicable if attacks_summary else [],
            secrets_found=secrets,
            code_issues=code_issues,
            findings=findings,
        )
    )

    if persist_health:
        record = ToolHealthRecord(
            id=uuid4().hex,
            tool_id=tool.id,
            version_id=version.id,
            file_map_hash=fhash,
            vuln_db_version=vdb,
            payload=health.model_dump(),
            checked_at=utc_now(),
        )
        db.add(record)
        db.commit()
    await _emit(emit, "check.completed", {"health": health.model_dump()})
    return health


async def run_provisional_health(
    db: Session,
    tool: ToolRecord,
    version: ToolVersionRecord,
    *,
    preview_url: str | None,
    checks: list[AcceptanceCheck],
    emit: EmitFn | None = None,
) -> ToolHealth:
    """Fast path after build: tests + secrets only."""
    files = version.files
    findings, secrets, code_issues = scan(files, tool_id=tool.id, version_id=version.id)
    failed_ids: list[str] = []
    passed = 0
    total = len(checks)
    if preview_url and checks:
        if _offline():
            os.environ["TERRARIUM_TRUST_OFFLINE"] = "1"
        results = run_checks(
            preview_url,
            translate_checks(checks, files),
            check_ids=[c.id for c in checks],
        )
        failed_ids = [r.checkId for r in results if r.status == "failed"]
        passed = sum(1 for r in results if r.status == "passed")
        await _emit(emit, "check.step", {"step": "tests", "status": "failed" if failed_ids else "passed"})
    health = compute_health(
        HealthInputs(
            tool_id=tool.id,
            version_id=version.id,
            file_map_hash=file_map_hash(files),
            stored_file_map_hash=file_map_hash(files),
            vuln_db_version=vuln_db_version(),
            checked_at=datetime.now(timezone.utc),
            tests_passed=passed,
            tests_total=total,
            failed_check_ids=failed_ids,
            secrets_found=secrets,
            code_issues=code_issues,
            findings=findings,
        )
    )
    health.status = "checking" if health.status == "healthy" and not failed_ids else health.status
    return health
