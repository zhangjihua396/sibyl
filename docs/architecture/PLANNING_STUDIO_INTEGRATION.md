# Planning Studio Integration Audit

This document ensures Planning Studio integrates cleanly with existing Sibyl patterns.

---

## Backend Integration

### 1. Database Models (`apps/api/src/sibyl/db/models.py`)

**Existing Patterns:**
- `TimestampMixin` for `created_at`/`updated_at`
- `utcnow_naive()` for naive UTC datetimes (TIMESTAMP WITHOUT TIME ZONE)
- `StrEnum` for status/type enums
- UUID primary keys with `uuid4` default
- JSONB for flexible nested data

**Planning Studio Must:**
```python
# Add to models.py

class PlanningPhase(StrEnum):
    """Planning session lifecycle phases."""
    CREATED = "created"
    BRAINSTORMING = "brainstorming"
    SYNTHESIZING = "synthesizing"
    DRAFTING = "drafting"
    READY = "ready"
    MATERIALIZED = "materialized"
    DISCARDED = "discarded"


class BrainstormThreadStatus(StrEnum):
    """Brainstorm agent thread status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PlanningSession(TimestampMixin, table=True):
    """Multi-agent planning/brainstorming session."""

    __tablename__ = "planning_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    org_id: UUID = Field(foreign_key="organizations.id", index=True)
    project_id: UUID | None = Field(foreign_key="projects.id", index=True)
    created_by: UUID = Field(foreign_key="users.id")

    title: str | None = Field(max_length=255)
    prompt: str = Field(sa_type=Text)
    phase: PlanningPhase = Field(default=PlanningPhase.CREATED)

    # Generated content (JSONB)
    personas: list[dict] | None = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    synthesis: str | None = Field(default=None, sa_type=Text)
    spec_draft: str | None = Field(default=None, sa_type=Text)
    task_drafts: list[dict] | None = Field(
        default=None,
        sa_column=Column(JSONB)
    )

    # Materialization results
    materialized_at: datetime | None = None
    epic_id: str | None = Field(max_length=50)  # Graph ID
    task_ids: list[str] | None = Field(
        default=None,
        sa_column=Column(JSONB)
    )
    document_id: str | None = Field(max_length=50)
    episode_id: str | None = Field(max_length=50)

    # Relationships
    threads: list["BrainstormThread"] = Relationship(back_populates="session")


class BrainstormThread(TimestampMixin, table=True):
    """Individual agent perspective in a brainstorm session."""

    __tablename__ = "brainstorm_threads"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="planning_sessions.id", index=True)

    persona_role: str = Field(max_length=100)
    persona_name: str | None = Field(max_length=100)
    persona_focus: str | None = Field(sa_type=Text)
    persona_system_prompt: str | None = Field(sa_type=Text)

    agent_id: str | None = Field(max_length=50)
    status: BrainstormThreadStatus = Field(default=BrainstormThreadStatus.PENDING)

    started_at: datetime | None = None
    completed_at: datetime | None = None

    # Relationships
    session: PlanningSession = Relationship(back_populates="threads")
    messages: list["BrainstormMessage"] = Relationship(back_populates="thread")


class BrainstormMessage(SQLModel, table=True):
    """Message in a brainstorm thread."""

    __tablename__ = "brainstorm_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(foreign_key="brainstorm_threads.id", index=True)

    role: str = Field(max_length=20)  # user, assistant, system
    content: str = Field(sa_type=Text)
    thinking: str | None = Field(default=None, sa_type=Text)

    created_at: datetime = Field(default_factory=utcnow_naive)

    # Relationships
    thread: BrainstormThread = Relationship(back_populates="messages")
```

---

### 2. API Routes (`apps/api/src/sibyl/api/routes/`)

**Existing Patterns:**
- Route files per domain (`tasks.py`, `agents.py`, `epics.py`)
- Decorators: `@handle_not_found`, `@log_operation`, `@handle_workflow_errors`
- Auth: `AuthContext`, `_require_org()`, `verify_entity_project_access()`
- Response schemas in `api/schemas.py`
- Consistent error handling via `api/errors.py`

**Planning Studio Must:**
```python
# New file: apps/api/src/sibyl/api/routes/planning.py

router = APIRouter(prefix="/planning", tags=["planning"])

# Middleware pattern from agents.py
def _require_org(ctx: AuthContext) -> Organization:
    if not ctx.organization:
        raise HTTPException(status_code=403, detail="Organization context required")
    return ctx.organization

async def _check_session_access(
    ctx: AuthContext,
    session: AsyncSession,
    planning_session: PlanningSession,
    required_role: ProjectRole = ProjectRole.VIEWER,
) -> None:
    """Verify user can access planning session."""
    # Org admin bypass
    if ctx.org_role in (OrganizationRole.OWNER, OrganizationRole.ADMIN):
        return
    # Creator access
    if planning_session.created_by == ctx.user.id:
        return
    # Project access (if session has project)
    if planning_session.project_id:
        await verify_entity_project_access(
            session, ctx, str(planning_session.project_id), required_role
        )


@router.post("/sessions", response_model=PlanningSessionResponse)
@log_operation("create_planning_session")
async def create_session(
    request: CreatePlanningSessionRequest,
    ctx: AuthContext = Depends(require_org_role(OrganizationRole.MEMBER)),
    auth: AuthSession = Depends(get_auth_session),
) -> PlanningSessionResponse:
    org = _require_org(ctx)
    # ... implementation
```

**Add to `api/routes/__init__.py`:**
```python
from .planning import router as planning_router

# In app setup:
app.include_router(planning_router, prefix="/api")
```

---

### 3. API Schemas (`apps/api/src/sibyl/api/schemas.py`)

**Existing Patterns:**
- Pydantic models with `model_config = ConfigDict(from_attributes=True)`
- Request/Response suffixes
- Nested schemas for complex objects

**Planning Studio Must:**
```python
# Add to schemas.py

class GeneratedPersonaSchema(BaseModel):
    """Generated persona for brainstorming."""
    role: str
    name: str
    emoji: str
    focus: str
    background: str
    system_prompt: str
    search_queries: list[str] = []


class TaskDraftSchema(BaseModel):
    """Draft task before materialization."""
    title: str
    description: str
    priority: str = "medium"
    size: str = "medium"  # small, medium, large
    tags: list[str] = []
    blocked_by: list[str] = []  # Titles of blocking tasks


class CreatePlanningSessionRequest(BaseModel):
    """Request to create a new planning session."""
    prompt: str = Field(..., min_length=10, max_length=5000)
    project_id: str | None = None
    title: str | None = None
    agent_count: int | None = Field(None, ge=2, le=5)


class PlanningSessionResponse(BaseModel):
    """Planning session response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    org_id: str
    project_id: str | None
    created_by: str
    title: str | None
    prompt: str
    phase: str
    personas: list[GeneratedPersonaSchema] | None
    synthesis: str | None
    spec_draft: str | None
    task_drafts: list[TaskDraftSchema] | None
    epic_id: str | None
    task_ids: list[str] | None
    created_at: datetime
    updated_at: datetime


class MaterializeRequest(BaseModel):
    """Request to materialize a planning session."""
    include_document: bool = True
    include_summary: bool = True
    epic_status: str = "planning"
    task_status: str = "backlog"


class MaterializationResult(BaseModel):
    """Result of materializing a planning session."""
    epic_id: str
    task_ids: list[str]
    document_id: str | None
    episode_id: str | None
```

---

### 4. WebSocket Events (`apps/api/src/sibyl/api/websocket.py`)

**Existing Patterns:**
- `ConnectionManager` with org-scoped broadcast
- Event format: `{"event": "name", "data": {...}, "timestamp": "..."}`
- Redis pub/sub for multi-pod

**Planning Studio Must:**
Add new event types:
```python
# Event types for planning
PLANNING_EVENTS = [
    "planning:thread_started",    # Thread spawned
    "planning:thread_message",    # New message in thread
    "planning:thread_completed",  # Thread finished
    "planning:phase_changed",     # Session phase transition
    "planning:brainstorm_complete", # All threads done
    "planning:synthesis_chunk",   # Streaming synthesis
    "planning:spec_chunk",        # Streaming spec
]
```

Event payloads:
```python
# planning:thread_message
{
    "session_id": "uuid",
    "thread_id": "uuid",
    "persona_role": "security_engineer",
    "message": {
        "id": "uuid",
        "role": "assistant",
        "content": "...",
        "created_at": "..."
    }
}

# planning:phase_changed
{
    "session_id": "uuid",
    "old_phase": "brainstorming",
    "new_phase": "synthesizing"
}
```

---

### 5. Services Layer (`apps/api/src/sibyl/services/`)

**Existing Patterns:**
- Services in `apps/api/src/sibyl/services/` (sparse currently)
- Agent logic in `apps/api/src/sibyl/agents/`
- Approval handling via `ApprovalService`

**Planning Studio Must:**
Create dedicated services:
```
apps/api/src/sibyl/planning/
├── __init__.py
├── persona_generator.py    # Dynamic persona generation
├── orchestrator.py         # BrainstormOrchestrator
├── synthesis.py            # SynthesisService
├── materialization.py      # MaterializationService
```

**Integrate with existing agent system:**
```python
# planning/orchestrator.py

class BrainstormOrchestrator:
    def __init__(
        self,
        db: AsyncSession,
        graph_client: GraphClient,
        manager: EntityManager,
        # Reuse existing infrastructure
        connection_manager: ConnectionManager,  # WebSocket
    ):
        self.db = db
        self.manager = manager
        self.ws = connection_manager

    async def _spawn_brainstorm_agent(
        self,
        thread: BrainstormThread,
        session: PlanningSession,
    ) -> str:
        """Spawn a lightweight agent for brainstorming.

        Uses simplified agent setup - no worktree, no approvals,
        just conversation with Sibyl context.
        """
        # Could reuse ClaudeSDKClient directly
        # or create a lightweight BrainstormAgent class
        pass
```

---

## Frontend Integration

### 1. API Client (`apps/web/src/lib/api.ts`)

**Existing Patterns:**
- Centralized `api` object with domain namespaces
- Typed request/response
- Consistent error handling

**Planning Studio Must:**
```typescript
// Add to api.ts

export const api = {
  // ... existing namespaces

  planning: {
    listSessions: async (params?: { project?: string; phase?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.project) searchParams.set('project', params.project);
      if (params?.phase) searchParams.set('phase', params.phase);
      const query = searchParams.toString();
      return fetchApi<PlanningSession[]>(`/planning/sessions${query ? `?${query}` : ''}`);
    },

    getSession: async (id: string) =>
      fetchApi<PlanningSessionDetail>(`/planning/sessions/${id}`),

    createSession: async (data: CreatePlanningSessionRequest) =>
      fetchApi<PlanningSession>('/planning/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    startBrainstorm: async (id: string) =>
      fetchApi<void>(`/planning/sessions/${id}/start`, { method: 'POST' }),

    sendMessage: async (id: string, message: string, threadId?: string) =>
      fetchApi<void>(`/planning/sessions/${id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message, thread_id: threadId }),
      }),

    synthesize: async (id: string) =>
      fetchApi<{ synthesis: string }>(`/planning/sessions/${id}/synthesize`, {
        method: 'POST',
      }),

    generateSpec: async (id: string) =>
      fetchApi<{ spec: string }>(`/planning/sessions/${id}/generate-spec`, {
        method: 'POST',
      }),

    updateSpec: async (id: string, spec: string) =>
      fetchApi<void>(`/planning/sessions/${id}/spec`, {
        method: 'PATCH',
        body: JSON.stringify({ spec }),
      }),

    extractTasks: async (id: string) =>
      fetchApi<{ tasks: TaskDraft[] }>(`/planning/sessions/${id}/extract-tasks`, {
        method: 'POST',
      }),

    materialize: async (id: string, options: MaterializeOptions) =>
      fetchApi<MaterializationResult>(`/planning/sessions/${id}/materialize`, {
        method: 'POST',
        body: JSON.stringify(options),
      }),

    discard: async (id: string) =>
      fetchApi<void>(`/planning/sessions/${id}`, { method: 'DELETE' }),
  },
};
```

---

### 2. React Query Hooks (`apps/web/src/lib/hooks.ts`)

**Existing Patterns:**
- `queryKeys` namespace for cache keys
- Hooks follow `use{Action}{Resource}` naming
- Mutations invalidate related queries

**Planning Studio Must:**
```typescript
// Add to queryKeys
export const queryKeys = {
  // ... existing keys

  planning: {
    all: ['planning'] as const,
    sessions: (params?: { project?: string; phase?: string }) =>
      ['planning', 'sessions', params] as const,
    session: (id: string) => ['planning', 'session', id] as const,
    threads: (sessionId: string) => ['planning', 'threads', sessionId] as const,
  },
};

// Hooks
export function usePlanningSessionsQuery(params?: { project?: string; phase?: string }) {
  return useQuery({
    queryKey: queryKeys.planning.sessions(params),
    queryFn: () => api.planning.listSessions(params),
  });
}

export function usePlanningSessionQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.planning.session(id),
    queryFn: () => api.planning.getSession(id),
    enabled: !!id,
  });
}

export function useCreatePlanningSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.planning.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
    },
  });
}

export function useStartBrainstormMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.planning.startBrainstorm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.session(id) });
    },
  });
}

export function useMaterializeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options: MaterializeOptions }) =>
      api.planning.materialize(id, options),
    onSuccess: () => {
      // Invalidate planning and epics/tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
```

---

### 3. WebSocket Events (`apps/web/src/lib/websocket.ts`)

**Existing Patterns:**
- Typed event payloads
- `EventPayloadMap` for type safety
- `wsClient.on()` for subscriptions

**Planning Studio Must:**
```typescript
// Add to websocket.ts

export interface PlanningThreadMessagePayload {
  session_id: string;
  thread_id: string;
  persona_role: string;
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
  };
}

export interface PlanningPhaseChangedPayload {
  session_id: string;
  old_phase: string;
  new_phase: string;
}

export interface PlanningStreamChunkPayload {
  session_id: string;
  chunk: string;
  type: 'synthesis' | 'spec';
}

// Add to EventPayloadMap
export interface EventPayloadMap {
  // ... existing events
  'planning:thread_message': PlanningThreadMessagePayload;
  'planning:thread_completed': { session_id: string; thread_id: string };
  'planning:phase_changed': PlanningPhaseChangedPayload;
  'planning:brainstorm_complete': { session_id: string };
  'planning:synthesis_chunk': PlanningStreamChunkPayload;
  'planning:spec_chunk': PlanningStreamChunkPayload;
}
```

---

### 4. Page Structure (`apps/web/src/app/(main)/`)

**Existing Patterns:**
- Feature directories under `(main)/`
- `page.tsx` for route, components in subdirectories
- Layout consistency with sidebar/main split

**Planning Studio Must:**
```
apps/web/src/app/(main)/planning/
├── page.tsx                    # Main planning studio page
├── [id]/
│   └── page.tsx               # Session detail view
└── components/
    ├── session-sidebar.tsx
    ├── new-session-modal.tsx
    ├── brainstorm-view.tsx
    ├── agent-thread-card.tsx
    ├── synthesis-view.tsx
    ├── spec-editor-view.tsx
    ├── task-draft-panel.tsx
    ├── materialize-modal.tsx
    └── materialized-view.tsx
```

---

## Multi-Tenancy & Security

### Organization Scoping

All Planning Studio operations MUST:
1. Require `AuthContext` with organization
2. Scope queries by `org_id`
3. Filter sessions by accessible projects (when project-scoped)

```python
# Every query must include org filter
query = select(PlanningSession).where(
    PlanningSession.org_id == ctx.organization.id
)

# Project-scoped sessions need project access check
if session.project_id:
    accessible = await list_accessible_project_graph_ids(db, ctx)
    if str(session.project_id) not in accessible:
        raise HTTPException(403, "Access denied")
```

### Permission Model

| Action | Required Role |
|--------|---------------|
| List sessions | Org MEMBER |
| View session | Creator OR project VIEWER+ |
| Create session | Org MEMBER |
| Start/message brainstorm | Session creator |
| Synthesize/generate spec | Session creator |
| Materialize | Session creator + project CONTRIBUTOR+ |
| Discard | Session creator |

---

## Agent System Integration

### Reuse vs. New

**Reuse from existing agent system:**
- `ClaudeSDKClient` for LLM calls
- `ConnectionManager` for WebSocket broadcasts
- `EntityManager` for graph operations
- Redis pub/sub for multi-pod

**New for Planning Studio:**
- `BrainstormOrchestrator` - lightweight multi-agent coordination
- `PersonaGenerator` - dynamic perspective generation
- `SynthesisService` - convergence logic
- `MaterializationService` - Sibyl entity creation

### Brainstorm Agents vs. Task Agents

| Aspect | Task Agent | Brainstorm Agent |
|--------|------------|------------------|
| Isolation | Worktree | None (read-only) |
| Approvals | Yes | No |
| Tools | Full MCP | Sibyl search only |
| Persistence | Full AgentRecord | Lightweight thread |
| Cost | Higher (long-running) | Lower (short burst) |

Brainstorm agents are ephemeral, conversational, and don't need the full harness.

---

## Migration Path

### Phase 1: Foundation
1. Add models to `db/models.py`
2. Create Alembic migration
3. Add schemas to `api/schemas.py`

### Phase 2: Backend Services
1. Create `planning/` service directory
2. Implement `PersonaGenerator`
3. Implement `BrainstormOrchestrator`
4. Add WebSocket event broadcasting

### Phase 3: API Routes
1. Create `routes/planning.py`
2. Add CRUD endpoints
3. Add brainstorm control endpoints
4. Add synthesis/spec endpoints
5. Add materialization endpoint

### Phase 4: Frontend
1. Add types and API client methods
2. Add React Query hooks
3. Add WebSocket event handlers
4. Build UI components
5. Add to navigation

---

## Testing Strategy

### Backend Tests
```
tests/
├── test_planning_models.py      # Model validation
├── test_planning_routes.py      # API endpoint tests
├── test_planning_auth.py        # Permission tests
├── test_persona_generator.py    # Persona generation
├── test_brainstorm.py           # Orchestration
├── test_synthesis.py            # Synthesis service
├── test_materialization.py      # Entity creation
```

### Frontend Tests
- Component unit tests with Testing Library
- Hook tests with mock API
- E2E tests for full workflow

---

## Checklist

- [ ] Models follow `TimestampMixin` pattern
- [ ] Enums use `StrEnum`
- [ ] Routes use existing decorators
- [ ] Auth uses `AuthContext` + `verify_entity_project_access`
- [ ] WebSocket uses `ConnectionManager.broadcast()`
- [ ] API client in centralized `api` object
- [ ] Hooks in `hooks.ts` with `queryKeys` namespace
- [ ] WebSocket events typed in `EventPayloadMap`
- [ ] Pages under `(main)/planning/`
- [ ] All queries scoped by `org_id`
- [ ] Project access checked for project-scoped sessions
- [ ] Tests cover permission scenarios
