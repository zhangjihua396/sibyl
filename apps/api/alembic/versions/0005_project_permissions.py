"""Add project-level RBAC tables.

Revision ID: 0005_project_permissions
Revises: 0004_agent_message_tool_tracking
Create Date: 2026-01-04

Adds tables for project-level access control:
- projects: Canonical project record linking to graph entities
- project_members: Direct user membership with roles
- team_projects: Team-level grants to projects
- api_key_project_scopes: Optional project restrictions for API keys
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_project_permissions"
down_revision: str | None = "0004_agent_message_tool_tracking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # =========================================================================
    # Enum Types
    # =========================================================================
    projectvisibility = postgresql.ENUM(
        "private", "project", "org", name="projectvisibility", create_type=False
    )
    projectrole = postgresql.ENUM(
        "project_owner",
        "project_maintainer",
        "project_contributor",
        "project_viewer",
        name="projectrole",
        create_type=False,
    )

    # Create enums (idempotent)
    connection = op.get_bind()
    projectvisibility.create(connection, checkfirst=True)
    projectrole.create(connection, checkfirst=True)

    # =========================================================================
    # projects - Canonical project record
    # =========================================================================
    op.create_table(
        "projects",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("graph_project_id", sa.String(length=64), nullable=False),
        sa.Column(
            "visibility",
            projectvisibility,
            nullable=False,
            server_default=sa.text("'org'"),
        ),
        sa.Column(
            "default_role",
            projectrole,
            nullable=False,
            server_default=sa.text("'project_viewer'"),
        ),
        sa.Column("owner_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "settings",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projects_organization_id", "projects", ["organization_id"])
    op.create_index("ix_projects_owner_user_id", "projects", ["owner_user_id"])
    op.create_index(
        "ix_projects_org_slug_unique", "projects", ["organization_id", "slug"], unique=True
    )
    op.create_index(
        "ix_projects_org_graph_id_unique",
        "projects",
        ["organization_id", "graph_project_id"],
        unique=True,
    )

    # =========================================================================
    # project_members - Direct user membership
    # =========================================================================
    op.create_table(
        "project_members",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            projectrole,
            nullable=False,
            server_default=sa.text("'project_contributor'"),
        ),
        sa.Column("joined_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_members_organization_id", "project_members", ["organization_id"])
    op.create_index("ix_project_members_project_id", "project_members", ["project_id"])
    op.create_index("ix_project_members_user_id", "project_members", ["user_id"])
    op.create_index(
        "ix_project_members_project_user_unique",
        "project_members",
        ["project_id", "user_id"],
        unique=True,
    )

    # =========================================================================
    # team_projects - Team-level grants
    # =========================================================================
    op.create_table(
        "team_projects",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("team_id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            projectrole,
            nullable=False,
            server_default=sa.text("'project_contributor'"),
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_team_projects_organization_id", "team_projects", ["organization_id"])
    op.create_index("ix_team_projects_team_id", "team_projects", ["team_id"])
    op.create_index("ix_team_projects_project_id", "team_projects", ["project_id"])
    op.create_index(
        "ix_team_projects_team_project_unique",
        "team_projects",
        ["team_id", "project_id"],
        unique=True,
    )

    # =========================================================================
    # api_key_project_scopes - Optional project restrictions for API keys
    # =========================================================================
    op.create_table(
        "api_key_project_scopes",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("api_key_id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column(
            "allowed_operations",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default=sa.text("'{}'::text[]"),
        ),
        sa.ForeignKeyConstraint(["api_key_id"], ["api_keys.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_key_project_scopes_api_key_id", "api_key_project_scopes", ["api_key_id"])
    op.create_index("ix_api_key_project_scopes_project_id", "api_key_project_scopes", ["project_id"])
    op.create_index(
        "ix_api_key_project_scopes_key_project_unique",
        "api_key_project_scopes",
        ["api_key_id", "project_id"],
        unique=True,
    )


def downgrade() -> None:
    # Drop tables in reverse order (respect foreign key dependencies)
    op.drop_table("api_key_project_scopes")
    op.drop_table("team_projects")
    op.drop_table("project_members")
    op.drop_table("projects")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS projectrole")
    op.execute("DROP TYPE IF EXISTS projectvisibility")
