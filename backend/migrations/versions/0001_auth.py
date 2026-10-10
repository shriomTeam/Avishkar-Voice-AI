"""Initial users, Google identities, sessions and workspace ownership."""

import sqlalchemy as sa
from alembic import op

revision = "0001_auth"
down_revision = None
branch_labels = None
depends_on = None


def record():
    return [
        sa.Column("id", sa.Uuid(), nullable=False, primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    ]


def user_fk():
    return sa.Column(
        "user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )


def upgrade():
    op.create_table(
        "users",
        *record(),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("display_name", sa.String(200), nullable=False),
        sa.Column("avatar_url", sa.String(2048)),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "auth_identities",
        *record(),
        user_fk(),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("provider", "subject"),
    )
    op.create_index("ix_auth_identities_user_id", "auth_identities", ["user_id"])
    op.create_table(
        "auth_sessions",
        *record(),
        user_fk(),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("csrf_token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_expires_at", "auth_sessions", ["expires_at"])
    op.create_table(
        "oauth_transactions",
        *record(),
        sa.Column("state_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("binding_hash", sa.String(64), nullable=False),
        sa.Column("nonce", sa.String(128), nullable=False),
        sa.Column("verifier", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_oauth_transactions_expires_at", "oauth_transactions", ["expires_at"])
    op.create_table(
        "workspaces",
        *record(),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("timezone", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(16)),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "workspace_memberships",
        *record(),
        user_fk(),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.UniqueConstraint("user_id", "workspace_id"),
    )
    op.create_index("ix_workspace_memberships_user_id", "workspace_memberships", ["user_id"])
    op.create_table(
        "rate_buckets",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_rate_buckets_expires_at", "rate_buckets", ["expires_at"])


def downgrade():
    for table in [
        "rate_buckets",
        "workspace_memberships",
        "workspaces",
        "oauth_transactions",
        "auth_sessions",
        "auth_identities",
        "users",
    ]:
        op.drop_table(table)
