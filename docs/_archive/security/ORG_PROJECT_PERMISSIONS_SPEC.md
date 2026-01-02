# Org + Project Permissions & RLS Spec (Draft)

## Goals

- Add **cohesive, enforceable** authorization across REST, MCP, CLI, Web UI.
- Support **org-level RBAC** (already present) and add **project-level RBAC**:
  - per-project membership
  - team-based access grants
  - distinct roles at org and project level
- Provide an implementation path for **Postgres RLS** as defense-in-depth for org/project-scoped
  tables.

## Non-Goals (for the first iteration)

- Full ABAC/policy engine (e.g., OPA) across all resources.
- Multi-org tokens that embed full membership lists (too large / stale).
- RLS in FalkorDB/Graphiti (not supported); graph access remains app-enforced.

## Existing Concepts (Today)

- Org (tenant boundary): `organizations`, `organization_members` in Postgres
  - Roles: `owner`, `admin`, `member`, `viewer`
- Teams (present in Postgres schema): `teams`, `team_members`
  - Roles: `lead`, `member`, `viewer`
- Projects / Epics / Tasks (stored in FalkorDB knowledge graph)
  - Graph entity IDs are strings (often deterministic, e.g. `project_<hash>`)
- Tenancy:
  - JWT access token contains `org`
  - Graph operations are scoped via `group_id == org.id`

## Proposed Authorization Model

### Org Roles (keep as-is)

- `owner`: full org control (members, settings, billing, all projects)
- `admin`: org control excluding destructive org actions (configurable)
- `member`: standard write access within org (subject to project membership)
- `viewer`: read-only within org (subject to project membership)

### Project Roles (new)

Suggested enum:

- `project_owner`: manage project settings + membership, full write
- `project_maintainer`: manage tasks/epics, write
- `project_contributor`: create/update tasks, write (no membership admin)
- `project_viewer`: read-only

### Visibility (new)

Projects should support:

- `org_visible`: all org members/viewers can access with a default role
- `private`: only explicit project members and granted teams can access

Default: `org_visible` (to avoid breaking current behavior).

### Inheritance Rules

- Org `owner/admin`:
  - Always has at least `project_owner` over all projects in the org.
- Org `member/viewer`:
  - Access determined by project visibility + membership grants.

### Team Grants

Add team → project grants:

- Team is granted a project role (e.g., `project_contributor`).
- User’s effective project role is the max(role from team grants, direct project membership).

## Storage / Data Model Changes (Postgres)

> Rationale: Permissions should be anchored in Postgres (already the auth source of truth), and can
> be protected with RLS.

Add tables:

1. `projects`

- `id` (UUID) PK
- `organization_id` (UUID) FK → `organizations.id`
- `graph_project_id` (TEXT) unique per org (the graph entity id, e.g. `project_abcd1234`)
- `name`, `slug` (optional), `visibility` (`org_visible|private`)
- timestamps

2. `project_members`

- `id` (UUID) PK
- `organization_id` (UUID) FK → `organizations.id` (denormalized for RLS)
- `project_id` (UUID) FK → `projects.id`
- `user_id` (UUID) FK → `users.id`
- `role` (`project_owner|project_maintainer|project_contributor|project_viewer`)
- unique(org, project, user)

3. `team_projects`

- `id` (UUID) PK
- `organization_id` (UUID)
- `team_id` (UUID) FK → `teams.id`
- `project_id` (UUID) FK → `projects.id`
- `role` (same project role enum)
- unique(team, project)

4. API key scoping (incremental)

- Add `scopes` (TEXT[]) or `scope` (TEXT) to `api_keys`
- Optional: `expires_at`, `last_used_at` already exists

## Enforcement Points (Backend)

### Centralize authorization

Introduce a single module (e.g., `src/sibyl/auth/authorization.py`) used by:

- REST route dependencies
- MCP tool entrypoints
- Background workers that act “on behalf of” an org/user

Core helpers:

- `require_org_role(...)`
- `require_project_role(project_graph_id, ...)`
- `get_allowed_project_graph_ids(ctx)`
- `assert_can_access_task(task_id)` (resolve task → project → membership)

### Graph access changes

Graph queries that return tasks/epics/projects should be filtered by allowed project graph IDs when
project RBAC is enabled.

Migration strategy:

- Phase 1: default `org_visible` for all existing projects; no behavior change.
- Phase 2: add “private projects” and enforce membership checks.

### Token/session cohesion changes

When org context changes (create org, switch org, accept invite), rotate refresh token or redesign
refresh semantics so refresh cannot revert org silently.

## Postgres RLS (Defense in Depth)

### Org-level RLS (Phase 1)

Enable RLS on org-scoped tables:

- `crawl_sources`, `crawled_documents`, `document_chunks`
- `api_keys`, `teams`, `team_members`
- `audit_logs`, `user_sessions`, `organization_invitations` (as appropriate)

Policy pattern:

- set `app.org_id` (uuid) and `app.user_id` (uuid) per request
- policy: `organization_id = current_setting('app.org_id', true)::uuid`

### Project-level RLS (Phase 2)

For project-scoped tables (e.g., future `documents.project_id`, `projects`, `project_members`):

- policy joins against allowed projects for `app.user_id`

Implementation note:

- This requires setting session variables per request/transaction in SQLAlchemy.
- Workers must explicitly set org/user context or use an admin connection role.

## Rollout Plan (Recommended)

1. **Hardening P0s**: WebSocket token verification; crawler link-graph org scoping; add tests.
2. **Token cohesion**: org switching refresh rotation; logout revokes sessions; add tests.
3. **API key scopes**: add schema + enforcement; CLI UX updates.
4. **Project RBAC**: add Postgres tables + enforcement; backfill existing projects; UI updates.
5. **RLS**: enable org-level RLS; expand to project-level.
