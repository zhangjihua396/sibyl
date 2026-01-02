# Sibyl Auth Stack Audit (Backend ↔ Web ↔ CLI ↔ MCP)

## Scope

This audit focuses on **authentication**, **authorization**, and **tenant scoping** across:

- Backend (FastAPI REST at `/api/*`)
- MCP (FastMCP at `/mcp` + OAuth endpoints on the same host)
- Web UI (Next.js 16)
- CLI (`sibyl`)
- Realtime channel (WebSocket at `/api/ws` proxied to `/ws` in the web app)

Goal: ensure the system behaves as a **secure, cohesive** auth system end-to-end, and identify gaps
blocking **org/project RBAC** and potential **Postgres RLS**.

## Architecture Map (Trust Boundaries)

**Clients**

- Browser (Web UI): cookie-based auth (HTTP-only cookies)
- CLI: Bearer access tokens + refresh tokens (stored locally) and API keys (`sk_*`)
- MCP client (Claude/Codex/etc): OAuth PKCE or API key / Bearer token

**Services**

- Next.js web (`web/`): proxies `/api/*` → backend, `/ws` → backend `/api/ws`
- Backend (Starlette + FastAPI): mounts REST at `/api`, MCP ASGI app at `/`
- Datastores:
  - Postgres (auth primitives, orgs, crawled docs, API keys, sessions, audit logs, etc.)
  - FalkorDB (Graphiti knowledge graph; org-scoped via `group_id`)
  - Redis (jobs + pubsub; currently shared)

## Current Auth Mechanisms

### Web (Browser)

- **Access token:** signed JWT (`sibyl_access_token`) stored in **HTTP-only** cookie
- **Refresh token:** signed JWT (`sibyl_refresh_token`) stored in **HTTP-only** cookie
- Login methods:
  - GitHub OAuth (`/api/auth/github` → `/api/auth/github/callback`)
  - Local email/password (`/api/auth/local/login`, `/api/auth/local/signup`)
- Token refresh: `/api/auth/refresh` (cookie-based by default)

### CLI

- Login methods (preference order):
  1. Device flow: `/api/auth/device` + `/api/auth/device/token` + browser approval at
     `/api/auth/device/verify`
  2. OAuth PKCE against MCP OAuth endpoints (`/.well-known/oauth-authorization-server`, `/register`,
     `/authorize`, `/token`)
  3. Local password (`/api/auth/local/login`) if provided
- Stores credentials in `~/.sibyl/auth.json` (per-server profiles supported)
- Sends `Authorization: Bearer <token>` for REST calls (JWT access token or `sk_*` API key)

### MCP

- When `SIBYL_MCP_AUTH_MODE` enables auth (default `auto`), FastMCP runs as:
  - OAuth Authorization Server (dynamic client registration, PKCE, etc.) via
    `src/sibyl/auth/mcp_oauth.py`
  - OAuth Resource Server for `/mcp` with required scope `mcp`
- Accepted tokens:
  - Sibyl JWT access tokens (Bearer)
  - API keys (`sk_*`)

### Tenancy / Org Scoping

- JWT access tokens carry `org` claim (organization UUID as string).
- FalkorDB/Graphiti scoping uses `group_id == org.id` (`src/sibyl/auth/tenancy.py`).
- Postgres org-scoped tables use `organization_id` columns (e.g., `crawl_sources`, `api_keys`,
  `teams`).
- Token semantics ADR: `docs/adr/0001-org-scoped-tokens.md`

## Findings (Security + Cohesion)

### Critical (P0)

1. **WebSocket org scoping trusts unverified JWT payload**

- Location: `src/sibyl/api/websocket.py`
- Behavior: `_extract_org_from_token()` base64-decodes JWT payload and trusts `org` without
  verifying signature/expiry.
- Impact: a client can provide a forged cookie header and subscribe to **another org’s broadcasts**
  (cross-tenant realtime data leak).
- Fix direction:
  - Verify the access token with `verify_access_token()` and only accept `org` from verified claims.
  - Optionally verify the user is a member of that org (DB check) if you want to prevent “stale org
    in token” issues.

2. **Crawler “link graph” endpoints are not org-scoped**

- Location: `src/sibyl/api/routes/crawler.py`
- Behavior:
  - `/api/sources/link-graph/status` aggregates **all orgs**
  - `/api/sources/link-graph` processes **all sources**
  - `/_process_graph_linking()` selects sources without filtering to the caller’s org
- Impact:
  - Cross-org data leakage (source names + counts)
  - Cross-org data contamination (marking chunks processed, linking entities into the wrong org
    graph)
- Fix direction:
  - Require org context on these endpoints and filter all DB reads/writes by
    `organization_id == org.id`.
  - Consider restricting these endpoints to `owner/admin` due to cost + blast radius.

### High (P1)

3. **Org switching is not cohesive across access vs refresh tokens**

- Locations:
  - `src/sibyl/api/routes/orgs.py` (`POST /orgs/{slug}/switch`)
  - `src/sibyl/api/routes/org_invitations.py` (`POST /invitations/{token}/accept`)
  - `src/sibyl/api/routes/orgs.py` (`POST /orgs` create org)
  - CLI mirrors this in `src/sibyl/cli/org.py`
- Behavior: these endpoints set a new **access token** (cookie + response body) but do not
  rotate/update the **refresh token**.
- Impact: after access token expiry/refresh, clients can silently “snap back” to the previous org,
  causing confusing UX and potential mis-targeted writes.
- Fix direction (choose one):
  - **Rotate refresh token** whenever org context changes (recommended incremental fix).
  - Or redesign refresh tokens to be org-agnostic + require explicit org selection at refresh.

4. **Logout does not revoke server-side sessions**

- Location: `src/sibyl/api/routes/auth.py` (`POST /auth/logout`)
- Behavior: deletes cookies only; does not revoke the `user_sessions` row tied to the refresh token.
- Impact: a stolen refresh token remains usable until expiry (30d default) even after “logout”.
- Fix direction:
  - If refresh cookie exists, revoke the session (lookup by refresh token hash) on logout.

5. **API key “scopes” are not implemented**

- README claims scoped keys; current schema does not store scopes on `api_keys`.
- Impact: API keys currently grant broad access (subject to org role), limiting least-privilege for
  automation/MCP.
- Fix direction:
  - Add scopes + enforcement (REST + MCP), and/or per-key role restriction.

### Medium (P2)

6. **CLI stores tokens unencrypted and without file-permission hardening**

- Location: `src/sibyl/cli/auth_store.py`
- Behavior: writes plaintext `~/.sibyl/auth.json` without enforcing `0600` permissions.
- Impact: local token exposure on shared machines / misconfigured home dirs.
- Fix direction:
  - Set restrictive file perms on write; optionally use OS keychain where available.

7. **Some “dev security” toggles are easy to misinterpret**

- `SIBYL_DISABLE_AUTH` currently disables role checks in places, but some routers become effectively
  unauthenticated when enabled.
- Fix direction:
  - Tighten semantics (e.g., “disable_authorization_checks”), and ensure “disable” modes never ship
    in staging/prod configs.

## Why RLS Matters (Defense in Depth)

Multi-tenant safety currently depends on consistent application-level filtering (e.g.,
`WHERE organization_id = $org`). The crawler `link-graph` bugs demonstrate how easy it is to miss a
filter and leak/corrupt cross-org data. **Postgres RLS** would provide a strong guardrail for
org-scoped tables.

## Next Steps

See:

- `docs/security/ORG_PROJECT_PERMISSIONS_SPEC.md` (RBAC model + RLS approach)
- `docs/security/AUTHZ_EPIC_TASKS.md` (epic + task breakdown with priorities and acceptance
  criteria)
