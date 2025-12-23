"""merge auth migrations

Revision ID: 9d0d6c6c2b0a
Revises: 3be408779353, 8c0f0d9c5e2a
Create Date: 2025-12-23 00:00:00

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "9d0d6c6c2b0a"
down_revision: str | Sequence[str] | None = ("3be408779353", "8c0f0d9c5e2a")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Merge branches; no-op."""


def downgrade() -> None:
    """Un-merge branches; no-op."""
