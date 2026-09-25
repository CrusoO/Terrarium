"""Publish visibility and tool members.

Revision ID: 20260930_0006
Revises: 20260928_0005
"""
from __future__ import annotations

from alembic import op

revision = "20260930_0006"
down_revision = "20260928_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE tools ADD COLUMN IF NOT EXISTS visibility VARCHAR(16) NOT NULL DEFAULT 'private'")
    op.execute("ALTER TABLE tools ADD COLUMN IF NOT EXISTS group_id VARCHAR(128)")
    op.execute("ALTER TABLE tools ADD COLUMN IF NOT EXISTS group_name VARCHAR(120)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tools_visibility ON tools (visibility)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tools_group_id ON tools (group_id)")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS tool_members (
            id          VARCHAR(64)  PRIMARY KEY,
            tool_id     VARCHAR(64)  NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
            user_id     VARCHAR(128) NOT NULL,
            email       VARCHAR(254),
            role        VARCHAR(16)  NOT NULL DEFAULT 'viewer',
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
            CONSTRAINT uq_tool_member UNIQUE (tool_id, user_id)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_tool_members_tool_id ON tool_members (tool_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tool_members_user_id ON tool_members (user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS tool_members")
    op.execute("DROP INDEX IF EXISTS ix_tools_group_id")
    op.execute("DROP INDEX IF EXISTS ix_tools_visibility")
    op.execute("ALTER TABLE tools DROP COLUMN IF EXISTS group_name")
    op.execute("ALTER TABLE tools DROP COLUMN IF EXISTS group_id")
    op.execute("ALTER TABLE tools DROP COLUMN IF EXISTS visibility")
