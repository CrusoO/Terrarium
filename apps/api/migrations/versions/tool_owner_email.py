"""Add owner_email to tools so group members can see each other's apps.

Revision ID: 20260928_0005
Revises: 20260927_0004
"""
from __future__ import annotations

from alembic import op

revision = "20260928_0005"
down_revision = "20260927_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE tools ADD COLUMN IF NOT EXISTS owner_email VARCHAR(254)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tools_owner_email ON tools (owner_email)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_tools_owner_email")
    op.execute("ALTER TABLE tools DROP COLUMN IF EXISTS owner_email")
