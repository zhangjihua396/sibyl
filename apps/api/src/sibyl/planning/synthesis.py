"""SynthesisService for combining brainstorm thread outputs.

Uses Claude to analyze all persona outputs and produce:
- Key themes and areas of agreement
- Points of contention and tradeoffs
- Actionable recommendations
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import anthropic
import structlog

from sibyl.db import get_session
from sibyl.db.models import PlanningPhase
from sibyl.planning.service import PlanningSessionService

log = structlog.get_logger()

# Use Sonnet for synthesis - needs good reasoning
_SYNTHESIS_MODEL = "claude-sonnet-4-20250514"


async def synthesize_brainstorm(
    session_id: UUID,
    org_id: UUID,
) -> dict[str, Any]:
    """Synthesize all brainstorm thread outputs into a cohesive summary.

    Collects all completed thread messages and uses Claude to analyze:
    - Common themes across personas
    - Areas of agreement
    - Points of contention
    - Key recommendations

    Args:
        session_id: Planning session ID
        org_id: Organization ID

    Returns:
        Dict with synthesis text and metadata
    """
    async with get_session() as db_session:
        service = PlanningSessionService(db_session)

        # Get session with threads
        session = await service.get_session(session_id, org_id, include_threads=True)
        if not session:
            raise ValueError(f"Session not found: {session_id}")

        if session.phase != PlanningPhase.synthesizing:
            raise ValueError(f"Session not in synthesizing phase: {session.phase}")

        # Collect all thread outputs
        threads = session.threads or []
        thread_outputs: list[dict[str, Any]] = []

        for thread in threads:
            messages = await service.list_messages(thread.id)
            # Get the assistant's response (last message typically)
            assistant_messages = [m for m in messages if m.role == "assistant"]
            if assistant_messages:
                thread_outputs.append(
                    {
                        "persona_name": thread.persona_name or thread.persona_role,
                        "persona_role": thread.persona_role,
                        "persona_focus": thread.persona_focus,
                        "response": assistant_messages[-1].content,
                    }
                )

        if not thread_outputs:
            raise ValueError("No brainstorm outputs to synthesize")

        # Build synthesis prompt
        synthesis_prompt = _build_synthesis_prompt(session.prompt, thread_outputs)

        # Call Claude for synthesis
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=_SYNTHESIS_MODEL,
            max_tokens=4000,
            messages=[{"role": "user", "content": synthesis_prompt}],
        )

        synthesis_text = response.content[0].text

        log.info(
            "Synthesis complete",
            session_id=str(session_id),
            input_threads=len(thread_outputs),
            synthesis_length=len(synthesis_text),
        )

        return {
            "synthesis": synthesis_text,
            "input_count": len(thread_outputs),
            "model": _SYNTHESIS_MODEL,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }


def _build_synthesis_prompt(
    original_prompt: str,
    thread_outputs: list[dict[str, Any]],
) -> str:
    """Build the synthesis prompt for Claude.

    Args:
        original_prompt: The original brainstorming topic
        thread_outputs: List of persona outputs

    Returns:
        Formatted prompt for synthesis
    """
    # Format each persona's contribution
    persona_sections = []
    for output in thread_outputs:
        section = f"""## {output['persona_name']} ({output['persona_role']})
**Focus:** {output['persona_focus']}

{output['response']}
"""
        persona_sections.append(section)

    personas_text = "\n---\n".join(persona_sections)

    return f"""You are synthesizing the outputs of a multi-perspective brainstorming session.

# Original Topic
{original_prompt}

# Brainstorm Contributions

{personas_text}

# Your Task

Analyze all contributions and produce a comprehensive synthesis that includes:

## 1. Key Themes
What are the major themes that emerged across multiple perspectives? What did multiple personas emphasize?

## 2. Areas of Agreement
Where did the personas converge? What recommendations or insights had broad support?

## 3. Points of Contention
Where did personas disagree? What tradeoffs were identified? Present both sides fairly.

## 4. Critical Risks & Concerns
What risks, challenges, or potential problems were raised? Don't sugarcoat - these are valuable insights.

## 5. Actionable Recommendations
Based on all perspectives, what are the top 5-7 concrete recommendations? Be specific and actionable.

## 6. Open Questions
What questions remain unanswered? What needs further investigation or user input?

Write in a clear, professional tone. Be direct and specific. The goal is to capture the collective intelligence of the brainstorm in a format that supports decision-making."""


async def run_synthesis_job(
    session_id: UUID,
    org_id: UUID,
) -> dict[str, Any]:
    """Job entry point for synthesis execution.

    Designed to be called from the ARQ worker.

    Args:
        session_id: Planning session UUID
        org_id: Organization UUID

    Returns:
        Synthesis result dict
    """
    log.info("Starting synthesis job", session_id=str(session_id))

    try:
        result = await synthesize_brainstorm(session_id, org_id)

        # Save synthesis to session
        async with get_session() as db_session:
            service = PlanningSessionService(db_session)
            await service.update_session(
                session_id,
                org_id,
                synthesis=result["synthesis"],
                phase=PlanningPhase.drafting,
            )
            await db_session.commit()

        # Publish completion event
        from sibyl.api.pubsub import publish_event

        await publish_event(
            "planning_synthesis_completed",
            {
                "session_id": str(session_id),
                "org_id": str(org_id),
                "synthesis_length": len(result["synthesis"]),
            },
        )

        log.info("Synthesis job complete", session_id=str(session_id))

        return result

    except Exception as e:
        log.exception("Synthesis job failed", session_id=str(session_id))
        raise RuntimeError(f"Synthesis failed: {e}") from e
