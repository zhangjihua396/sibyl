"""Manage endpoint for task workflow and admin operations.

Exposes the canonical manage() tool via REST for the web UI.
"""

from dataclasses import asdict
from typing import Any

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from sibyl.auth.dependencies import get_current_organization, require_org_role
from sibyl.db.models import Organization, OrganizationRole

log = structlog.get_logger()
router = APIRouter(
    prefix="/manage",
    tags=["manage"],
    dependencies=[
        Depends(
            require_org_role(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
                OrganizationRole.MEMBER,
            )
        ),
    ],
)


class ManageRequest(BaseModel):
    """Request schema for manage operations."""

    action: str = Field(..., description="Action to perform")
    entity_id: str | None = Field(default=None, description="Target entity ID")
    data: dict[str, Any] | None = Field(default=None, description="Action-specific data")


class ManageResponseSchema(BaseModel):
    """Response schema for manage operations."""

    success: bool
    action: str
    entity_id: str | None = None
    message: str
    data: dict[str, Any] | None = None


@router.post("", response_model=ManageResponseSchema)
async def manage(
    request: ManageRequest,
    org: Organization = Depends(get_current_organization),
) -> ManageResponseSchema:
    """Execute a manage action.

    Supports task workflow, epic workflow, source operations, and analysis actions.

    Task Workflow Actions:
        - start_task: Begin work on a task (sets status to 'doing')
        - block_task: Mark task as blocked (data.reason required)
        - unblock_task: Remove blocked status, resume work
        - submit_review: Submit for code review (sets status to 'review')
        - complete_task: Mark done (data.learnings optional)
        - archive_task: Archive without completing
        - update_task: Update task fields (data contains updates)

    Epic Workflow Actions:
        - start_epic: Move epic to in_progress status
        - complete_epic: Mark epic as completed (data.learnings optional)
        - archive_epic: Archive epic (data.reason optional)
        - update_epic: Update epic fields

    Source Operations:
        - crawl: Trigger crawl of URL (data.url required, data.depth optional)
        - sync: Re-crawl existing source (entity_id = source ID)
        - refresh: Sync all sources

    Analysis Actions:
        - estimate: Estimate task effort from similar completed tasks
        - prioritize: Get smart task ordering for project
        - detect_cycles: Find circular dependencies in project
        - suggest: Get knowledge suggestions for a task

    For health/stats, use /admin/health and /admin/stats instead.
    """
    try:
        from sibyl.tools.manage import manage as core_manage

        result = await core_manage(
            action=request.action,
            entity_id=request.entity_id,
            data=request.data,
            organization_id=str(org.id),
        )

        return ManageResponseSchema(**asdict(result))

    except Exception as e:
        log.exception("manage_endpoint_failed", action=request.action, error=str(e))
        raise HTTPException(status_code=500, detail="Operation failed. Please try again.") from e
