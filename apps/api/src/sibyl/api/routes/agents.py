"""Agent management endpoints.

REST API for managing AI agents via the AgentOrchestrator.
"""

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from sibyl.auth.dependencies import get_current_organization, require_org_role
from sibyl.db.models import Organization, OrganizationRole
from sibyl_core.graph.client import get_graph_client
from sibyl_core.graph.entities import EntityManager
from sibyl_core.models import (
    AgentRecord,
    AgentSpawnSource,
    AgentStatus,
    AgentType,
    EntityType,
)

log = structlog.get_logger()
_WRITE_ROLES = (
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
)

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
    dependencies=[Depends(require_org_role(*_WRITE_ROLES))],
)


# =============================================================================
# Request/Response Models
# =============================================================================


class AgentResponse(BaseModel):
    """Agent record response."""

    id: str
    name: str
    agent_type: str
    status: str
    task_id: str | None = None
    project_id: str | None = None
    spawn_source: str | None = None
    started_at: str | None = None
    completed_at: str | None = None
    last_heartbeat: str | None = None
    tokens_used: int = 0
    cost_usd: float = 0.0
    worktree_path: str | None = None
    worktree_branch: str | None = None
    error_message: str | None = None


class AgentListResponse(BaseModel):
    """Response containing list of agents."""

    agents: list[AgentResponse]
    total: int
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}


class SpawnAgentRequest(BaseModel):
    """Request to spawn a new agent."""

    prompt: str
    agent_type: AgentType = AgentType.GENERAL
    project_id: str
    task_id: str | None = None


class SpawnAgentResponse(BaseModel):
    """Response from spawning an agent."""

    success: bool
    agent_id: str
    message: str


class AgentActionRequest(BaseModel):
    """Request for agent actions (pause, resume, terminate)."""

    reason: str | None = None


class AgentActionResponse(BaseModel):
    """Response from agent action."""

    success: bool
    agent_id: str
    action: str
    message: str


# =============================================================================
# Endpoints
# =============================================================================


@router.get("", response_model=AgentListResponse)
async def list_agents(
    project: str | None = None,
    status: AgentStatus | None = None,
    agent_type: AgentType | None = None,
    limit: int = 50,
    org: Organization = Depends(get_current_organization),
) -> AgentListResponse:
    """List agents for the organization.

    Args:
        project: Filter by project ID
        status: Filter by agent status
        agent_type: Filter by agent type
        limit: Maximum results
        org: Current organization
    """
    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    # Get all agents
    results = await manager.list_by_type(
        entity_type=EntityType.AGENT,
        limit=limit * 2,  # Fetch extra for filtering
    )

    agents = [r for r in results if isinstance(r, AgentRecord)]

    # Apply filters
    if project:
        agents = [a for a in agents if a.project_id == project]
    if status:
        agents = [a for a in agents if a.status == status]
    if agent_type:
        agents = [a for a in agents if a.agent_type == agent_type]

    # Calculate stats
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    for agent in agents:
        s = agent.status.value
        by_status[s] = by_status.get(s, 0) + 1
        t = agent.agent_type.value
        by_type[t] = by_type.get(t, 0) + 1

    return AgentListResponse(
        agents=[_agent_to_response(a) for a in agents[:limit]],
        total=len(agents),
        by_status=by_status,
        by_type=by_type,
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    org: Organization = Depends(get_current_organization),
) -> AgentResponse:
    """Get a specific agent by ID."""
    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    entity = await manager.get(agent_id)
    if not entity or not isinstance(entity, AgentRecord):
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")

    return _agent_to_response(entity)


@router.post("", response_model=SpawnAgentResponse)
async def spawn_agent(
    request: SpawnAgentRequest,
    org: Organization = Depends(get_current_organization),
) -> SpawnAgentResponse:
    """Spawn a new agent.

    Note: This creates an agent record but does not start execution.
    Execution is handled by the orchestrator service.
    """
    from sibyl.agents import AgentRunner, WorktreeManager

    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    # Get task if specified
    task = None
    if request.task_id:
        from sibyl_core.models import Task

        entity = await manager.get(request.task_id)
        if entity and isinstance(entity, Task):
            task = entity

    # Create worktree manager and agent runner
    # Note: In production, the orchestrator would handle this
    worktree_manager = WorktreeManager(
        entity_manager=manager,
        org_id=str(org.id),
        project_id=request.project_id,
        repo_path=".",  # Would come from project config
    )

    runner = AgentRunner(
        entity_manager=manager,
        worktree_manager=worktree_manager,
        org_id=str(org.id),
        project_id=request.project_id,
    )

    try:
        instance = await runner.spawn(
            prompt=request.prompt,
            agent_type=request.agent_type,
            task=task,
            spawn_source=AgentSpawnSource.USER,
            create_worktree=False,  # Don't create worktree via API
            enable_approvals=True,
        )

        return SpawnAgentResponse(
            success=True,
            agent_id=instance.id,
            message=f"Agent {instance.id} spawned successfully",
        )
    except Exception as e:
        log.exception("Failed to spawn agent", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{agent_id}/pause", response_model=AgentActionResponse)
async def pause_agent(
    agent_id: str,
    request: AgentActionRequest,
    org: Organization = Depends(get_current_organization),
) -> AgentActionResponse:
    """Pause an agent's execution."""
    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    entity = await manager.get(agent_id)
    if not entity or not isinstance(entity, AgentRecord):
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")

    if entity.status not in (AgentStatus.WORKING, AgentStatus.WAITING_APPROVAL):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pause agent in {entity.status} status",
        )

    await manager.update(
        agent_id,
        {
            "status": AgentStatus.PAUSED.value,
            "paused_reason": request.reason or "user_request",
        },
    )

    return AgentActionResponse(
        success=True,
        agent_id=agent_id,
        action="pause",
        message=f"Agent {agent_id} paused",
    )


@router.post("/{agent_id}/resume", response_model=AgentActionResponse)
async def resume_agent(
    agent_id: str,
    org: Organization = Depends(get_current_organization),
) -> AgentActionResponse:
    """Resume a paused agent."""
    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    entity = await manager.get(agent_id)
    if not entity or not isinstance(entity, AgentRecord):
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")

    if entity.status != AgentStatus.PAUSED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resume agent in {entity.status} status",
        )

    await manager.update(
        agent_id,
        {
            "status": AgentStatus.RESUMING.value,
            "paused_reason": None,
        },
    )

    return AgentActionResponse(
        success=True,
        agent_id=agent_id,
        action="resume",
        message=f"Agent {agent_id} resuming",
    )


@router.post("/{agent_id}/terminate", response_model=AgentActionResponse)
async def terminate_agent(
    agent_id: str,
    request: AgentActionRequest,
    org: Organization = Depends(get_current_organization),
) -> AgentActionResponse:
    """Terminate an agent."""
    client = await get_graph_client()
    manager = EntityManager(client, group_id=str(org.id))

    entity = await manager.get(agent_id)
    if not entity or not isinstance(entity, AgentRecord):
        raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")

    terminal_states = (AgentStatus.COMPLETED, AgentStatus.FAILED, AgentStatus.TERMINATED)
    if entity.status in terminal_states:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already in terminal state: {entity.status}",
        )

    await manager.update(
        agent_id,
        {
            "status": AgentStatus.TERMINATED.value,
            "error_message": request.reason or "user_terminated",
        },
    )

    return AgentActionResponse(
        success=True,
        agent_id=agent_id,
        action="terminate",
        message=f"Agent {agent_id} terminated",
    )


# =============================================================================
# Helpers
# =============================================================================


def _agent_to_response(agent: AgentRecord) -> AgentResponse:
    """Convert AgentRecord to response model."""
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        agent_type=agent.agent_type.value,
        status=agent.status.value,
        task_id=agent.task_id,
        project_id=agent.project_id,
        spawn_source=agent.spawn_source.value if agent.spawn_source else None,
        started_at=agent.started_at.isoformat() if agent.started_at else None,
        completed_at=agent.completed_at.isoformat() if agent.completed_at else None,
        last_heartbeat=agent.last_heartbeat.isoformat() if agent.last_heartbeat else None,
        tokens_used=agent.tokens_used or 0,
        cost_usd=agent.cost_usd or 0.0,
        worktree_path=agent.worktree_path,
        worktree_branch=agent.worktree_branch,
        error_message=agent.paused_reason,  # Use paused_reason for error context
    )
