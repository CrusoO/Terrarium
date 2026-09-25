"""Groups, group members, and preview access requests

Revision ID: 20260927_0004
Revises: 20260924_0003
Create Date: 2026-09-27 00:00:00
"""
from __future__ import annotations

from alembic import op

revision = "20260927_0004"
down_revision = "20260924_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS groups (
            id          VARCHAR(64)  PRIMARY KEY,
            name        VARCHAR(120) NOT NULL,
            created_by  VARCHAR(128) NOT NULL,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_groups_created_by ON groups (created_by)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS group_members (
            id         VARCHAR(64)  PRIMARY KEY,
            group_id   VARCHAR(64)  NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            user_id    VARCHAR(128) NOT NULL,
            email      VARCHAR(254) NOT NULL,
            role       VARCHAR(16)  NOT NULL DEFAULT 'member',
            joined_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
            CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_group_members_group_id ON group_members (group_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_group_members_user_id  ON group_members (user_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS preview_access_requests (
            id               VARCHAR(64)  PRIMARY KEY,
            session_id       VARCHAR(64)  NOT NULL,
            requester_id     VARCHAR(128) NOT NULL,
            requester_email  VARCHAR(254) NOT NULL,
            owner_id         VARCHAR(128) NOT NULL,
            status           VARCHAR(16)  NOT NULL DEFAULT 'pending',
            created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_par_session_id ON preview_access_requests (session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_par_owner_id   ON preview_access_requests (owner_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_par_requester  ON preview_access_requests (requester_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS preview_access_requests")
    op.execute("DROP TABLE IF EXISTS group_members")
    op.execute("DROP TABLE IF EXISTS groups")
