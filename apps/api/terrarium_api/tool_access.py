"""Tool visibility and membership (P6-S2 / P6-S3)."""
from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from terrarium_api.group_access import email_in_group, user_group_ids
from terrarium_api.models import ToolMemberRecord, ToolRecord, utc_now


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def member_role(db: Session, tool: ToolRecord, user: dict[str, str]) -> str | None:
    if tool.owner_id == user["id"] or _norm(tool.owner_email) == _norm(user.get("email")):
        return "owner"
    row = db.scalars(
        select(ToolMemberRecord).where(
            ToolMemberRecord.tool_id == tool.id,
            ToolMemberRecord.user_id == user["id"],
        )
    ).first()
    if row:
        return row.role
    email = _norm(user.get("email"))
    if email:
        row = db.scalars(
            select(ToolMemberRecord).where(
                ToolMemberRecord.tool_id == tool.id,
                ToolMemberRecord.email == email,
            )
        ).first()
        if row:
            return row.role
    return None


def can_see_tool(tool: ToolRecord, user: dict[str, str], db: Session) -> bool:
    if member_role(db, tool, user) in {"owner", "editor", "viewer"}:
        return True
    visibility = (tool.visibility or "private").strip()
    if visibility == "all":
        return True
    if visibility == "group" and tool.group_id:
        return email_in_group(db, tool.group_id, user)
    return False


def can_edit_tool(tool: ToolRecord, user: dict[str, str], db: Session) -> bool:
    return member_role(db, tool, user) in {"owner", "editor"}


def visible_group_ids(db: Session, user: dict[str, str]) -> set[str]:
    return user_group_ids(db, user)


def ensure_owner_member(db: Session, tool: ToolRecord) -> None:
    existing = db.scalars(
        select(ToolMemberRecord).where(
            ToolMemberRecord.tool_id == tool.id,
            ToolMemberRecord.user_id == tool.owner_id,
        )
    ).first()
    if existing:
        existing.role = "owner"
        existing.email = existing.email or tool.owner_email
        return
    db.add(
        ToolMemberRecord(
            id=uuid4().hex,
            tool_id=tool.id,
            user_id=tool.owner_id,
            email=tool.owner_email,
            role="owner",
            created_at=utc_now(),
        )
    )


def upsert_member(
    db: Session,
    tool: ToolRecord,
    *,
    user_id: str,
    email: str | None,
    role: str,
) -> ToolMemberRecord:
    if user_id == tool.owner_id:
        raise ValueError("Owner membership cannot be changed")
    if role not in {"editor", "viewer"}:
        raise ValueError("Role must be editor or viewer")
    row = db.scalars(
        select(ToolMemberRecord).where(
            ToolMemberRecord.tool_id == tool.id,
            ToolMemberRecord.user_id == user_id,
        )
    ).first()
    if row is None and email:
        row = db.scalars(
            select(ToolMemberRecord).where(
                ToolMemberRecord.tool_id == tool.id,
                ToolMemberRecord.email == _norm(email),
            )
        ).first()
    if row:
        row.role = role
        row.email = _norm(email) or row.email
        return row
    row = ToolMemberRecord(
        id=uuid4().hex,
        tool_id=tool.id,
        user_id=user_id,
        email=_norm(email) or None,
        role=role,
        created_at=utc_now(),
    )
    db.add(row)
    return row


def list_members(db: Session, tool: ToolRecord) -> list[ToolMemberRecord]:
    ensure_owner_member(db, tool)
    return list(
        db.scalars(
            select(ToolMemberRecord)
            .where(ToolMemberRecord.tool_id == tool.id)
            .order_by(ToolMemberRecord.created_at.asc())
        ).all()
    )
