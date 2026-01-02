"""Add tool_id and parent_tool_use_id columns for message pairing and subagent grouping.

Revision ID: 0004_agent_message_tool_tracking
Revises: 0003_agent_messages
Create Date: 2026-01-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_agent_message_tool_tracking"
down_revision: str | None = "0003_agent_messages"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add tool tracking columns
    op.add_column(
        "agent_messages",
        sa.Column("tool_id", sa.String(64), nullable=True),
    )
    op.add_column(
        "agent_messages",
        sa.Column("parent_tool_use_id", sa.String(64), nullable=True),
    )

    # Individual indexes for each column
    op.create_index(
        "ix_agent_messages_tool_id",
        "agent_messages",
        ["tool_id"],
    )
    op.create_index(
        "ix_agent_messages_parent_tool_use_id",
        "agent_messages",
        ["parent_tool_use_id"],
    )

    # Composite index for efficient subagent grouping queries
    op.create_index(
        "ix_agent_messages_parent",
        "agent_messages",
        ["agent_id", "parent_tool_use_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_agent_messages_parent", table_name="agent_messages")
    op.drop_index("ix_agent_messages_parent_tool_use_id", table_name="agent_messages")
    op.drop_index("ix_agent_messages_tool_id", table_name="agent_messages")
    op.drop_column("agent_messages", "parent_tool_use_id")
    op.drop_column("agent_messages", "tool_id")
