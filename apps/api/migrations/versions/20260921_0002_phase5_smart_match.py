"""phase 5 smart match index

Revision ID: 20260921_0002
Revises: 20260917_0001
Create Date: 2026-09-21 15:47:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260921_0002"
down_revision = "20260917_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tool_index",
        sa.Column("tool_id", sa.String(length=64), nullable=False),
        sa.Column("stack", sa.String(length=32), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("prompt_fingerprint", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tool_id"], ["tools.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("tool_id"),
    )
    op.create_index(op.f("ix_tool_index_tool_id"), "tool_index", ["tool_id"], unique=False)
    op.create_index(op.f("ix_tool_index_stack"), "tool_index", ["stack"], unique=False)
    op.create_index(
        op.f("ix_tool_index_prompt_fingerprint"),
        "tool_index",
        ["prompt_fingerprint"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_tool_index_prompt_fingerprint"), table_name="tool_index")
    op.drop_index(op.f("ix_tool_index_stack"), table_name="tool_index")
    op.drop_index(op.f("ix_tool_index_tool_id"), table_name="tool_index")
    op.drop_table("tool_index")
