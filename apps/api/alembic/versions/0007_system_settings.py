"""Add system_settings table for storing configuration in database.

Enables zero-config quickstart by allowing API keys and other settings
to be entered during onboarding and stored in the database.

Revision ID: 0007_system_settings
Revises: 0006_row_level_security
Create Date: 2025-01-04
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007_system_settings"
down_revision: str | None = "0006_row_level_security"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(128), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("is_secret", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Create index for faster lookups
    op.create_index("ix_system_settings_is_secret", "system_settings", ["is_secret"])


def downgrade() -> None:
    op.drop_index("ix_system_settings_is_secret")
    op.drop_table("system_settings")
