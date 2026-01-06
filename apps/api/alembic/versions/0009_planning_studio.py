"""Add Planning Studio tables for multi-agent brainstorming.

Revision ID: 0009_planning_studio
Revises: 0008_add_shared_project
Create Date: 2026-01-06

Tables:
- planning_sessions: Multi-agent planning/brainstorming sessions
- brainstorm_threads: Individual agent perspectives in a session
- brainstorm_messages: Messages within brainstorm threads
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0009_planning_studio"
down_revision: str | None = "0008_add_shared_project"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create enum types
    op.execute(
        "CREATE TYPE planningphase AS ENUM "
        "('created', 'brainstorming', 'synthesizing', 'drafting', 'ready', 'materialized', 'discarded')"
    )
    op.execute(
        "CREATE TYPE brainstormthreadstatus AS ENUM "
        "('pending', 'running', 'completed', 'failed')"
    )

    # planning_sessions table
    op.create_table(
        "planning_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "org_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column(
            "phase",
            postgresql.ENUM(
                "created",
                "brainstorming",
                "synthesizing",
                "drafting",
                "ready",
                "materialized",
                "discarded",
                name="planningphase",
                create_type=False,
            ),
            nullable=False,
            server_default="created",
        ),
        # Generated content (JSONB)
        sa.Column(
            "personas",
            postgresql.JSONB(),
            nullable=True,
        ),
        sa.Column("synthesis", sa.Text(), nullable=True),
        sa.Column("spec_draft", sa.Text(), nullable=True),
        sa.Column(
            "task_drafts",
            postgresql.JSONB(),
            nullable=True,
        ),
        # Materialization results
        sa.Column("materialized_at", sa.DateTime(), nullable=True),
        sa.Column("epic_id", sa.String(50), nullable=True),
        sa.Column(
            "task_ids",
            postgresql.JSONB(),
            nullable=True,
        ),
        sa.Column("document_id", sa.String(50), nullable=True),
        sa.Column("episode_id", sa.String(50), nullable=True),
        # Timestamps
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

    # Index for active sessions (exclude terminal states)
    op.create_index(
        "ix_planning_sessions_active",
        "planning_sessions",
        ["org_id", "phase"],
        postgresql_where=sa.text("phase NOT IN ('materialized', 'discarded')"),
    )

    # brainstorm_threads table
    op.create_table(
        "brainstorm_threads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("planning_sessions.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("persona_role", sa.String(100), nullable=False),
        sa.Column("persona_name", sa.String(100), nullable=True),
        sa.Column("persona_focus", sa.Text(), nullable=True),
        sa.Column("persona_system_prompt", sa.Text(), nullable=True),
        sa.Column("agent_id", sa.String(50), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "pending",
                "running",
                "completed",
                "failed",
                name="brainstormthreadstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # brainstorm_messages table
    op.create_table(
        "brainstorm_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "thread_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("brainstorm_threads.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(20), nullable=False),  # user, assistant, system
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("thinking", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
            index=True,
        ),
    )

    # Composite index for message ordering
    op.create_index(
        "ix_brainstorm_messages_thread_created",
        "brainstorm_messages",
        ["thread_id", "created_at"],
    )


def downgrade() -> None:
    # Drop tables in reverse order (respecting foreign keys)
    op.drop_index("ix_brainstorm_messages_thread_created", table_name="brainstorm_messages")
    op.drop_table("brainstorm_messages")
    op.drop_table("brainstorm_threads")
    op.drop_index("ix_planning_sessions_active", table_name="planning_sessions")
    op.drop_table("planning_sessions")
    op.execute("DROP TYPE brainstormthreadstatus")
    op.execute("DROP TYPE planningphase")
