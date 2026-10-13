"""Phase 7 trust gate tables

Revision ID: phase7_trust
"""

from alembic import op
import sqlalchemy as sa

revision = "phase7_trust"
down_revision = "20261006_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tools", sa.Column("draft_version_id", sa.String(length=64), nullable=True))
    op.add_column(
        "tools",
        sa.Column("auto_approve_tests", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "tool_versions",
        sa.Column("is_live", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column("tool_versions", sa.Column("acceptance_checks", sa.JSON(), nullable=True))

    op.create_table(
        "tool_health",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("tool_id", sa.String(length=64), sa.ForeignKey("tools.id", ondelete="CASCADE"), index=True),
        sa.Column("version_id", sa.String(length=64), index=True),
        sa.Column("file_map_hash", sa.String(length=64), index=True),
        sa.Column("vuln_db_version", sa.String(length=32)),
        sa.Column("payload", sa.JSON()),
        sa.Column("checked_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "vuln_ledger",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("tool_id", sa.String(length=64), sa.ForeignKey("tools.id", ondelete="CASCADE"), index=True),
        sa.Column("kind", sa.String(length=32)),
        sa.Column("finding_id", sa.String(length=64), nullable=True),
        sa.Column("detail", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "remediation_campaigns",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("advisory_id", sa.String(length=128), index=True),
        sa.Column("payload", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table("remediation_campaigns")
    op.drop_table("vuln_ledger")
    op.drop_table("tool_health")
    op.drop_column("tool_versions", "acceptance_checks")
    op.drop_column("tool_versions", "is_live")
    op.drop_column("tools", "auto_approve_tests")
    op.drop_column("tools", "draft_version_id")
