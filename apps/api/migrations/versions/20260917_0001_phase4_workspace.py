"""phase 4 workspace schema

Revision ID: 20260917_0001
Revises:
Create Date: 2026-09-17 02:21:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260917_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tools",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("latest_session_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tools_owner_id"), "tools", ["owner_id"], unique=False)
    op.create_index(op.f("ix_tools_status"), "tools", ["status"], unique=False)

    op.create_table(
        "tool_versions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("tool_id", sa.String(length=64), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("files", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tool_versions_tool_id"), "tool_versions", ["tool_id"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("tool_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sessions_owner_id"), "sessions", ["owner_id"], unique=False)
    op.create_index(op.f("ix_sessions_status"), "sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_sessions_status"), table_name="sessions")
    op.drop_index(op.f("ix_sessions_owner_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_tool_versions_tool_id"), table_name="tool_versions")
    op.drop_table("tool_versions")
    op.drop_index(op.f("ix_tools_status"), table_name="tools")
    op.drop_index(op.f("ix_tools_owner_id"), table_name="tools")
    op.drop_table("tools")
