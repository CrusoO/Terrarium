"""Drop unused users table; store tool id on access requests.

Revision ID: 20261006_0007
Revises: 20260930_0006
"""
from __future__ import annotations

from alembic import op

revision = "20261006_0007"
down_revision = "20260930_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("ALTER TABLE preview_access_requests ADD COLUMN IF NOT EXISTS tool_id VARCHAR(64)")
    op.execute("ALTER TABLE preview_access_requests ADD COLUMN IF NOT EXISTS tool_name VARCHAR(120)")
    op.execute("ALTER TABLE preview_access_requests ALTER COLUMN session_id DROP NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_par_tool_id ON preview_access_requests (tool_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_par_tool_id")
    op.execute("ALTER TABLE preview_access_requests DROP COLUMN IF EXISTS tool_name")
    op.execute("ALTER TABLE preview_access_requests DROP COLUMN IF EXISTS tool_id")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id            VARCHAR(64)  PRIMARY KEY,
            email         VARCHAR(254) NOT NULL UNIQUE,
            password_hash TEXT         NOT NULL,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
