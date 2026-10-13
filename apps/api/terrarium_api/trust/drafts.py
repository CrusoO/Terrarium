from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session
from terrarium_contracts import AcceptanceCheck, FileMap

from terrarium_api.models import ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.trust.file_hash import file_map_hash
from terrarium_api.trust.regression import merge_regression_checks


def upsert_draft_version(
    db: Session,
    tool: ToolRecord,
    files: FileMap,
    *,
    prompt: str,
    summary: str,
    new_checks: list[AcceptanceCheck] | None = None,
) -> ToolVersionRecord:
    """Create or update draft version; never mutates live versions."""
    checks = merge_regression_checks(db, tool, new_checks)
    if tool.draft_version_id:
        draft = db.get(ToolVersionRecord, tool.draft_version_id)
        if draft and draft.tool_id == tool.id:
            draft.files = files
            draft.prompt = prompt
            draft.summary = summary
            draft.acceptance_checks = [c.model_dump() for c in checks]
            db.commit()
            db.refresh(draft)
            return draft
    draft = ToolVersionRecord(
        id=uuid4().hex,
        tool_id=tool.id,
        version_number=max((v.version_number for v in tool.versions), default=0) + 1,
        prompt=prompt,
        summary=summary,
        files=files,
        is_live=False,
        acceptance_checks=[c.model_dump() for c in checks],
    )
    db.add(draft)
    tool.draft_version_id = draft.id
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(draft)
    return draft


def mark_health_stale(db: Session, tool: ToolRecord) -> None:
    """Saving a draft invalidates cached health until re-check (handled by hash mismatch)."""
    tool.updated_at = utc_now()
    db.commit()
