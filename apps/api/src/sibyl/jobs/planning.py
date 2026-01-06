"""Planning Studio job functions.

Background jobs for brainstorming sessions:
- run_brainstorming: Execute parallel persona agents
- run_synthesis: Synthesize brainstorm outputs
"""

from typing import Any
from uuid import UUID

import structlog

log = structlog.get_logger()


async def run_brainstorming(
    _ctx: dict[str, Any],
    session_id: str,
    org_id: str,
    round_number: int = 1,
) -> dict[str, Any]:
    """Execute a brainstorming round with all personas.

    Runs multiple Claude agents in parallel, each with a unique
    persona, and stores their responses to the database.

    Args:
        _ctx: arq context (unused)
        session_id: Planning session UUID
        org_id: Organization UUID
        round_number: Which brainstorming round (1, 2, etc.)

    Returns:
        Summary dict with results per persona
    """
    from sibyl.planning.orchestrator import run_brainstorming_job

    log.info(
        "Starting brainstorming job",
        session_id=session_id,
        org_id=org_id,
        round=round_number,
    )

    try:
        result = await run_brainstorming_job(
            session_id=UUID(session_id),
            org_id=UUID(org_id),
            round_number=round_number,
        )

        log.info(
            "Brainstorming job complete",
            session_id=session_id,
            personas=len(result.get("personas", [])),
            errors=len(result.get("errors", [])),
        )

        return result

    except Exception as e:
        log.exception("Brainstorming job failed", session_id=session_id)
        raise RuntimeError(f"Brainstorming failed: {e}") from e


async def run_synthesis(
    _ctx: dict[str, Any],
    session_id: str,
    org_id: str,
) -> dict[str, Any]:
    """Synthesize brainstorm outputs into a cohesive summary.

    Collects all thread outputs and generates:
    - Key themes and areas of agreement
    - Points of contention and tradeoffs
    - Actionable recommendations

    Args:
        _ctx: arq context (unused)
        session_id: Planning session UUID
        org_id: Organization UUID

    Returns:
        Synthesis result dict
    """
    from sibyl.planning.synthesis import run_synthesis_job

    log.info(
        "Starting synthesis job",
        session_id=session_id,
        org_id=org_id,
    )

    try:
        result = await run_synthesis_job(
            session_id=UUID(session_id),
            org_id=UUID(org_id),
        )

        log.info(
            "Synthesis job complete",
            session_id=session_id,
        )

        return result

    except Exception as e:
        log.exception("Synthesis job failed", session_id=session_id)
        raise RuntimeError(f"Synthesis failed: {e}") from e


async def run_materialization(
    _ctx: dict[str, Any],
    session_id: str,
    org_id: str,
    project_id: str | None = None,
    epic_title: str | None = None,
    epic_priority: str = "medium",
) -> dict[str, Any]:
    """Materialize a planning session into Sibyl entities.

    Creates:
    - Epic for the overall feature/initiative
    - Tasks from task_drafts, linked to the epic
    - Document with the spec_draft
    - Episode with the synthesis

    Args:
        _ctx: arq context (unused)
        session_id: Planning session UUID
        org_id: Organization UUID
        project_id: Optional project to assign entities to
        epic_title: Override title for the epic
        epic_priority: Priority for the epic

    Returns:
        Materialization result dict with created entity IDs
    """
    from sibyl.planning.materialization import run_materialization_job

    log.info(
        "Starting materialization job",
        session_id=session_id,
        org_id=org_id,
    )

    try:
        result = await run_materialization_job(
            session_id=UUID(session_id),
            org_id=UUID(org_id),
            project_id=UUID(project_id) if project_id else None,
            epic_title=epic_title,
            epic_priority=epic_priority,
        )

        log.info(
            "Materialization job complete",
            session_id=session_id,
            epic_id=result.get("epic_id"),
        )

        return result

    except Exception as e:
        log.exception("Materialization job failed", session_id=session_id)
        raise RuntimeError(f"Materialization failed: {e}") from e
