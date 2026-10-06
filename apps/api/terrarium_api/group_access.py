"""Resolve group membership from Postgres."""
from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from terrarium_api.models import GroupMemberRecord


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def _memberships(db: Session, user: dict[str, str]) -> list[GroupMemberRecord]:
    email = _norm(user.get("email"))
    filters = [GroupMemberRecord.user_id == user["id"]]
    if email:
        filters.append(GroupMemberRecord.email == email)
    return list(db.scalars(select(GroupMemberRecord).where(or_(*filters))).all())


def claim_memberships(db: Session, user: dict[str, str]) -> None:
    """Attach email-only invites to this Firebase uid after the user signs in."""
    email = _norm(user.get("email"))
    if not email:
        return
    for row in db.scalars(select(GroupMemberRecord).where(GroupMemberRecord.email == email)).all():
        if row.user_id == user["id"]:
            continue
        taken = db.scalars(
            select(GroupMemberRecord).where(
                GroupMemberRecord.group_id == row.group_id,
                GroupMemberRecord.user_id == user["id"],
            )
        ).first()
        if taken:
            continue
        row.user_id = user["id"]


def user_group_ids(db: Session, user: dict[str, str]) -> set[str]:
    return {row.group_id for row in _memberships(db, user)}


def email_in_group(db: Session, group_id: str, user: dict[str, str]) -> bool:
    email = _norm(user.get("email"))
    filters = [GroupMemberRecord.user_id == user["id"]]
    if email:
        filters.append(GroupMemberRecord.email == email)
    row = db.scalars(
        select(GroupMemberRecord).where(
            GroupMemberRecord.group_id == group_id,
            or_(*filters),
        )
    ).first()
    return row is not None
