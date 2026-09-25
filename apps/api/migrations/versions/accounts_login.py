"""P6-S1: user accounts table

Revision ID: 20260924_0003
Revises: 20260921_0002
Create Date: 2026-09-24 00:00:00
"""
from __future__ import annotations

from alembic import op

revision = "20260924_0003"
down_revision = "20260921_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            VARCHAR(64)  PRIMARY KEY,
            email         VARCHAR(254) NOT NULL UNIQUE,
            password_hash TEXT         NOT NULL,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS users")
