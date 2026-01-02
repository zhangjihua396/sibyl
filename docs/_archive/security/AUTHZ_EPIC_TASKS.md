# Epic: AuthZ Audit → Secure Cohesive Permissions System

This epic breaks down the work required to make auth a secure, cohesive system across **backend +
web + CLI + MCP**, and to introduce **org/project permissions** plus optional **Postgres RLS**.

Seed data (optional): `docs/security/authz_epic_tasks_seed.json`

## Epic Setup (Sibyl CLI commands)

Create a project + epic (adjust names if you already have a “Security” project):

1. Create project:

- `sibyl project create --name "Security & Permissions" --description "Auth hardening, RBAC, and RLS workstream"`

2. Create epic (use returned project id):

- `sibyl epic create --project <PROJECT_ID> --title "AuthZ hardening + org/project RBAC" --description "Fix auth cohesion issues, close tenant leaks, implement project permissions, and add optional Postgres RLS." --priority high`

Then create tasks below with `sibyl task create --project <PROJECT_ID> --epic <EPIC_ID> ...`.

## Tasks (Prioritized)

### P0 — Tenant Isolation / Security Fixes

1. Fix WebSocket org scoping to verify JWT

- Components: backend
- Evidence: `src/sibyl/api/websocket.py`
- Acceptance:
  - `org_id` is derived only from verified tokens
  - invalid/forged cookies cannot subscribe to other org broadcasts
  - update/extend `tests/test_websocket.py` accordingly

2. Scope crawler link-graph endpoints to current org

- Components: backend, DB
- Evidence: `src/sibyl/api/routes/crawler.py` (`/link-graph`, `/link-graph/status`,
  `_process_graph_linking`)
- Acceptance:
  - `/api/sources/link-graph/status` reports only sources/chunks in the caller org
  - `/api/sources/link-graph` processes only sources in the caller org
  - `/api/sources/{source_id}/link-graph` rejects cross-org source ids (404)

3. Scope crawler “sync source” endpoint to current org

- Components: backend, DB
- Evidence: `src/sibyl/api/routes/crawler.py` (`POST /sources/{source_id}/sync`)
- Acceptance:
  - cannot sync sources outside the caller org
  - add regression test for cross-org source id denial

### P1 — Token/Session Cohesion & Least Privilege

4. Make org switching rotate refresh tokens (web + CLI)

- Components: backend, web, CLI
- Evidence: `src/sibyl/api/routes/orgs.py`, `src/sibyl/api/routes/org_invitations.py`,
  `src/sibyl/cli/org.py`
- Acceptance:
  - switching org cannot “snap back” after refresh
  - web and CLI both preserve org context across refresh

5. Revoke server-side session on logout

- Components: backend
- Evidence: `src/sibyl/api/routes/auth.py` (`POST /auth/logout`)
- Acceptance:
  - logout revokes the session matching refresh token (if present)
  - refresh token cannot be used after logout

6. Implement API key scopes + enforcement

- Components: backend, DB, CLI, MCP
- Evidence: `src/sibyl/auth/api_keys.py`, `src/sibyl/auth/dependencies.py`,
  `src/sibyl/auth/mcp_oauth.py`
- Acceptance:
  - API keys store explicit scopes (and optional expiry)
  - REST endpoints enforce scopes where appropriate
  - MCP requires `mcp` scope for tool calls

7. Harden CLI token storage

- Components: CLI
- Evidence: `src/sibyl/cli/auth_store.py`
- Acceptance:
  - `~/.sibyl/auth.json` written with restrictive permissions (0600)
  - optional: pluggable keychain backend (future)

### P2 — Project RBAC (Org → Project Permissions)

8. Add Postgres schema for projects + project memberships + team grants

- Components: DB, backend
- Deliverable: Alembic migration + SQLModel models
- Acceptance:
  - `projects`, `project_members`, `team_projects` tables
  - enums for `project_role` and project visibility

9. Enforce project permissions on task + epic operations

- Components: backend, MCP, CLI
- Acceptance:
  - task create/update/list respects allowed projects
  - project-private visibility works (404 for non-members)

10. Add team management APIs and UX

- Components: backend, web, CLI
- Acceptance:
  - create/list/update teams
  - manage team members + roles
  - grant team access to projects

### P3 — Postgres RLS (Defense in Depth)

11. Enable org-level RLS for org-scoped tables

- Components: DB, backend
- Acceptance:
  - RLS policies prevent cross-org reads/writes even if a filter is missed
  - request-scoped session variables (`app.org_id`, `app.user_id`) are set for all DB interactions

12. Extend RLS to project-level policies

- Components: DB, backend
- Acceptance:
  - project-private resources enforced at DB level (where applicable)

## Notes / Dependencies

- Address P0 items before adding project-level RBAC; project RBAC depends on reliable tenant
  isolation.
- If RLS is adopted, design how workers/admin jobs set org context or use an admin DB role safely.
