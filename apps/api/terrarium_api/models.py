from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from terrarium_api.db import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ToolRecord(Base):
    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(128), index=True)
    owner_email: Mapped[str | None] = mapped_column(String(254), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    summary: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="stopped", index=True)
    visibility: Mapped[str] = mapped_column(String(16), default="private", index=True)
    group_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    group_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latest_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    draft_version_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auto_approve_tests: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    versions: Mapped[list[ToolVersionRecord]] = relationship(
        back_populates="tool",
        cascade="all, delete-orphan",
        order_by="ToolVersionRecord.version_number",
    )


class ToolVersionRecord(Base):
    __tablename__ = "tool_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tool_id: Mapped[str] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    prompt: Mapped[str] = mapped_column(Text, default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    files: Mapped[dict[str, str]] = mapped_column(JSON)
    is_live: Mapped[bool] = mapped_column(default=True)
    acceptance_checks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    tool: Mapped[ToolRecord] = relationship(back_populates="versions")


class ToolHealthRecord(Base):
    __tablename__ = "tool_health"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tool_id: Mapped[str] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    version_id: Mapped[str] = mapped_column(String(64), index=True)
    file_map_hash: Mapped[str] = mapped_column(String(64), index=True)
    vuln_db_version: Mapped[str] = mapped_column(String(32))
    payload: Mapped[dict] = mapped_column(JSON)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class LedgerEntryRecord(Base):
    __tablename__ = "vuln_ledger"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tool_id: Mapped[str] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    finding_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detail: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class RemediationCampaignRecord(Base):
    __tablename__ = "remediation_campaigns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    advisory_id: Mapped[str] = mapped_column(String(128), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class ToolMemberRecord(Base):
    __tablename__ = "tool_members"
    __table_args__ = (UniqueConstraint("tool_id", "user_id", name="uq_tool_member"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tool_id: Mapped[str] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    role: Mapped[str] = mapped_column(String(16), default="viewer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(128), index=True)
    tool_id: Mapped[str | None] = mapped_column(ForeignKey("tools.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="stopped", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


# ── P6 Groups & Access Requests ─────────────────────────────────────────────

class GroupRecord(Base):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    created_by: Mapped[str] = mapped_column(String(128), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    members: Mapped[list["GroupMemberRecord"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class GroupMemberRecord(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_member"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    email: Mapped[str] = mapped_column(String(254))
    role: Mapped[str] = mapped_column(String(16), default="member")  # admin | member
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    group: Mapped["GroupRecord"] = relationship(back_populates="members")


class PreviewAccessRequestRecord(Base):
    __tablename__ = "preview_access_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    tool_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    tool_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    requester_id: Mapped[str] = mapped_column(String(128), index=True)
    requester_email: Mapped[str] = mapped_column(String(254))
    owner_id: Mapped[str] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | approved | denied
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class ToolIndexRecord(Base):
    """P5-S1: Smart Match index for published tools using deterministic fingerprints."""

    __tablename__ = "tool_index"

    tool_id: Mapped[str] = mapped_column(
        ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    stack: Mapped[str] = mapped_column(String(32), index=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    prompt_fingerprint: Mapped[str] = mapped_column(String(64), index=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
