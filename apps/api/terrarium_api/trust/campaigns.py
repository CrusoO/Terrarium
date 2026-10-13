from __future__ import annotations

import logging
from collections import defaultdict
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from terrarium_contracts import RemediationCampaign, VulnerabilityFinding

from terrarium_api.models import RemediationCampaignRecord, ToolRecord, ToolVersionRecord
from terrarium_api.trust.gate import run_publish_check
from terrarium_api.trust.remediation import run_ladder
from terrarium_api.trust.regression import merge_regression_checks
from terrarium_sandbox.trust import scan

logger = logging.getLogger(__name__)


async def run_fleet_campaigns(db: Session) -> list[RemediationCampaign]:
    """Group live tools by advisoryId and patch in batches of 5."""
    live_versions = db.scalars(
        select(ToolVersionRecord).where(ToolVersionRecord.is_live.is_(True))
    ).all()
    by_advisory: dict[str, list[tuple[ToolRecord, ToolVersionRecord, VulnerabilityFinding]]] = defaultdict(list)
    for version in live_versions:
        tool = db.get(ToolRecord, version.tool_id)
        if not tool:
            continue
        findings, _, _ = scan(version.files, tool_id=tool.id, version_id=version.id)
        for finding in findings:
            if finding.advisoryId:
                by_advisory[finding.advisoryId].append((tool, version, finding))

    campaigns: list[RemediationCampaign] = []
    for advisory_id, entries in by_advisory.items():
        tool_ids = [t.id for t, _, _ in entries]
        canary_tool = max(entries, key=lambda e: len(e[1].acceptance_checks or []))[0]
        fixed = failed = pending = 0
        for tool, version, finding in entries[:5]:
            draft = version
            if tool.draft_version_id:
                draft = db.get(ToolVersionRecord, tool.draft_version_id) or version
            run_ladder(db, tool, draft, [finding])
            checks = merge_regression_checks(db, tool, None)
            health = await run_publish_check(
                db,
                tool,
                draft,
                checks=checks,
                regression_checks=checks,
            )
            if health.status in ("healthy", "warning"):
                fixed += 1
            else:
                failed += 1
        pending = max(0, len(entries) - fixed - failed)
        campaign = RemediationCampaign(
            id=uuid4().hex,
            advisoryId=advisory_id,
            toolIds=tool_ids,
            canaryToolId=canary_tool.id,
            fixed=fixed,
            failed=failed,
            pendingApproval=pending,
        )
        db.add(
            RemediationCampaignRecord(
                id=campaign.id,
                advisory_id=advisory_id,
                payload=campaign.model_dump(),
            )
        )
        campaigns.append(campaign)
    db.commit()
    logger.info("Fleet campaigns complete: %s", len(campaigns))
    return campaigns


async def approve_campaign_by_index(db: Session, owner_id: str, index: int) -> tuple[bool, str]:
    """APPROVE N from morning digest — publish canary draft when healthy."""
    from sqlalchemy import select as sa_select

    tools = {t.id: t for t in db.scalars(sa_select(ToolRecord).where(ToolRecord.owner_id == owner_id)).all()}
    campaigns: list[RemediationCampaignRecord] = list(
        db.scalars(
            sa_select(RemediationCampaignRecord).order_by(RemediationCampaignRecord.created_at.desc()).limit(20)
        ).all()
    )
    eligible = []
    for row in campaigns:
        payload = row.payload or {}
        canary = str(payload.get("canaryToolId") or "")
        if canary in tools and int(payload.get("pendingApproval") or 0) > 0:
            eligible.append((row, tools[canary]))
    if index < 1 or index > len(eligible):
        return False, f"No campaign at index {index}."
    _row, tool = eligible[index - 1]
    if not tool.draft_version_id:
        return False, "Nothing pending approval for that campaign."
    from terrarium_api.trust.publish import promote_draft_version

    try:
        await promote_draft_version(db, tool, acknowledge_warnings=True)
    except Exception as exc:
        return False, f"Gate blocked publish: {exc}"
    return True, f"Campaign item {index} published for {tool.name}."


async def run_morning_digest(db: Session) -> int:
    """Send one digest per owner with APPROVE lines (P7-S10)."""
    import os

    import httpx
    from sqlalchemy import select as sa_select

    campaigns = list(
        db.scalars(
            sa_select(RemediationCampaignRecord).order_by(RemediationCampaignRecord.created_at.desc()).limit(50)
        ).all()
    )
    if not campaigns:
        return 0
    base = os.environ.get("RELAY_URL", "").rstrip("/")
    token = next((t.strip() for t in os.environ.get("WORKER_TOKENS", "").split(",") if t.strip()), "")
    if not base or not token:
        logger.warning("Morning digest skipped — RELAY_URL or WORKER_TOKENS missing")
        return 0
    headers = {"Authorization": f"Bearer {token}"}
    owners: dict[str, list[str]] = defaultdict(list)
    index = 1
    for row in campaigns:
        payload = row.payload or {}
        if int(payload.get("pendingApproval") or 0) <= 0:
            continue
        tool_ids = payload.get("toolIds") or []
        for tool_id in tool_ids[:5]:
            tool = db.get(ToolRecord, str(tool_id))
            if not tool:
                continue
            owners[tool.owner_id].append(
                f"{index}. {tool.name}: {payload.get('advisoryId')} — fixed {payload.get('fixed')} / failed {payload.get('failed')}"
            )
            index += 1
    sent = 0
    async with httpx.AsyncClient(timeout=30) as client:
        for owner_id, lines in owners.items():
            if not lines:
                continue
            addr_resp = await client.get(f"{base}/admin/actors/{owner_id}/address", headers=headers)
            address = addr_resp.json().get("address") if addr_resp.status_code == 200 else None
            address = os.environ.get("DIGEST_WHATSAPP_ADDRESS") or address
            if not address:
                continue
            link_resp = await client.post(
                f"{base}/admin/outbound",
                headers=headers,
                json={
                    "address": address,
                    "text": "Morning digest\n" + "\n".join(lines) + "\nReply APPROVE <n> to publish.",
                },
            )
            if link_resp.status_code == 200:
                sent += 1
    logger.info("Morning digest queued for %s owners", sent)
    return sent
