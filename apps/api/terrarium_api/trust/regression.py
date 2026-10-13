from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from terrarium_contracts import AcceptanceCheck

from terrarium_api.models import ToolRecord, ToolVersionRecord


def merge_regression_checks(
    db: Session,
    tool: ToolRecord,
    new_checks: list[AcceptanceCheck] | None,
) -> list[AcceptanceCheck]:
    """Accumulate checks from live + prior versions; new_checks append by id."""
    by_id: dict[str, AcceptanceCheck] = {}
    live_versions = db.scalars(
        select(ToolVersionRecord)
        .where(ToolVersionRecord.tool_id == tool.id, ToolVersionRecord.is_live.is_(True))
        .order_by(ToolVersionRecord.version_number)
    ).all()
    for version in live_versions:
        for raw in version.acceptance_checks or []:
            check = AcceptanceCheck.model_validate(raw)
            by_id[check.id] = check
    if tool.draft_version_id:
        draft = db.get(ToolVersionRecord, tool.draft_version_id)
        if draft:
            for raw in draft.acceptance_checks or []:
                check = AcceptanceCheck.model_validate(raw)
                by_id[check.id] = check
    for check in new_checks or []:
        by_id[check.id] = check
    return list(by_id.values())
