"""add tags, categories, and favicon_url to crawl_sources

Revision ID: d07ae5d9f2c3
Revises: 0001_initial_schema
Create Date: 2025-12-27 13:39:47.746666

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d07ae5d9f2c3"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tags, categories, and favicon_url columns to crawl_sources."""
    op.add_column(
        "crawl_sources",
        sa.Column(
            "tags",
            sa.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "crawl_sources",
        sa.Column(
            "categories",
            sa.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "crawl_sources",
        sa.Column(
            "favicon_url",
            sa.String(2048),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Remove tags, categories, and favicon_url columns."""
    op.drop_column("crawl_sources", "favicon_url")
    op.drop_column("crawl_sources", "categories")
    op.drop_column("crawl_sources", "tags")
