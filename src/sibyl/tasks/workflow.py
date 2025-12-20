"""Task workflow engine for status transitions and automations."""

import re
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import structlog

from sibyl.models.entities import Episode, EntityType, Relationship, RelationshipType
from sibyl.models.tasks import Task, TaskStatus

if TYPE_CHECKING:
    from sibyl.graph.client import GraphClient
    from sibyl.graph.entities import EntityManager
    from sibyl.graph.relationships import RelationshipManager

log = structlog.get_logger()


class TaskWorkflowEngine:
    """Handles task status transitions and automations."""

    def __init__(
        self,
        entity_manager: "EntityManager",
        relationship_manager: "RelationshipManager",
        graph_client: "GraphClient"
    ) -> None:
        """Initialize workflow engine with graph managers."""
        self._entity_manager = entity_manager
        self._relationship_manager = relationship_manager
        self._graph_client = graph_client

    async def start_task(self, task_id: str, assignee: str) -> Task:
        """Transition task to 'doing' status.

        Args:
            task_id: Task UUID
            assignee: User starting the task

        Returns:
            Updated task
        """
        log.info("Starting task", task_id=task_id, assignee=assignee)

        # Get current task
        entity = await self._entity_manager.get(task_id)
        task = self._entity_to_task(entity)

        # Build updates
        updates = {
            "status": TaskStatus.DOING,
            "started_at": datetime.now(UTC),
        }

        # Add assignee if not already assigned
        if assignee not in task.assignees:
            updates["assignees"] = task.assignees + [assignee]

        # Auto-suggest branch name if not set
        if not task.branch_name:
            branch_name = self._generate_branch_name(task)
            updates["branch_name"] = branch_name
            log.info("Generated branch name", task_id=task_id, branch=branch_name)

        # Update task
        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        log.info("Task started successfully", task_id=task_id, branch=updated_task.branch_name)
        return updated_task

    async def submit_for_review(
        self,
        task_id: str,
        commit_shas: list[str],
        pr_url: str | None = None
    ) -> Task:
        """Move task to review status.

        Args:
            task_id: Task UUID
            commit_shas: Git commit SHAs implementing this task
            pr_url: Pull request URL

        Returns:
            Updated task
        """
        log.info("Submitting task for review", task_id=task_id, pr_url=pr_url)

        updates = {
            "status": TaskStatus.REVIEW,
            "commit_shas": commit_shas,
            "reviewed_at": datetime.now(UTC),
        }

        if pr_url:
            updates["pr_url"] = pr_url

        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        log.info("Task submitted for review", task_id=task_id, commits=len(commit_shas))
        return updated_task

    async def complete_task(
        self,
        task_id: str,
        actual_hours: float | None = None,
        learnings: str = ""
    ) -> Task:
        """Mark task as done and capture learnings.

        Args:
            task_id: Task UUID
            actual_hours: Actual time spent on task
            learnings: What was learned completing this task

        Returns:
            Updated task
        """
        log.info("Completing task", task_id=task_id)

        # Get current task
        entity = await self._entity_manager.get(task_id)
        task = self._entity_to_task(entity)

        # Build updates
        updates = {
            "status": TaskStatus.DONE,
            "completed_at": datetime.now(UTC),
        }

        if actual_hours is not None:
            updates["actual_hours"] = actual_hours

        if learnings:
            updates["learnings"] = learnings

        # Update task
        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        # Create episode from completed task if learnings provided
        if learnings:
            await self._create_learning_episode(updated_task)

        # Update project progress
        if task.project_id:
            await self._update_project_progress(task.project_id)

        log.info("Task completed successfully", task_id=task_id)
        return updated_task

    async def block_task(
        self,
        task_id: str,
        blocker_description: str
    ) -> Task:
        """Mark task as blocked.

        Args:
            task_id: Task UUID
            blocker_description: Description of the blocker

        Returns:
            Updated task
        """
        log.info("Blocking task", task_id=task_id)

        # Get current task
        entity = await self._entity_manager.get(task_id)
        task = self._entity_to_task(entity)

        # Add blocker to list
        blockers = task.blockers_encountered + [blocker_description]

        updates = {
            "status": TaskStatus.BLOCKED,
            "blockers_encountered": blockers,
        }

        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        log.info("Task blocked", task_id=task_id, blocker=blocker_description)
        return updated_task

    async def unblock_task(self, task_id: str) -> Task:
        """Unblock a task and return to doing status.

        Args:
            task_id: Task UUID

        Returns:
            Updated task
        """
        log.info("Unblocking task", task_id=task_id)

        updates = {
            "status": TaskStatus.DOING,
        }

        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        log.info("Task unblocked", task_id=task_id)
        return updated_task

    async def archive_task(self, task_id: str, reason: str = "") -> Task:
        """Archive a task without completing it.

        Args:
            task_id: Task UUID
            reason: Reason for archiving

        Returns:
            Updated task
        """
        log.info("Archiving task", task_id=task_id, reason=reason)

        updates = {
            "status": TaskStatus.ARCHIVED,
            "metadata": {"archive_reason": reason} if reason else {},
        }

        updated_entity = await self._entity_manager.update(task_id, updates)
        updated_task = self._entity_to_task(updated_entity)

        # Update project progress
        entity = await self._entity_manager.get(task_id)
        task = self._entity_to_task(entity)
        if task.project_id:
            await self._update_project_progress(task.project_id)

        log.info("Task archived", task_id=task_id)
        return updated_task

    async def _create_learning_episode(self, task: Task) -> str:
        """Convert completed task into a knowledge episode.

        Args:
            task: Completed task with learnings

        Returns:
            Episode UUID
        """
        log.info("Creating learning episode from task", task_id=task.id)

        # Format episode content
        content_parts = [
            f"## Task: {task.title}",
            "",
            f"**Status**: {task.status}",
            f"**Feature**: {task.feature or 'N/A'}",
            f"**Technologies**: {', '.join(task.technologies)}",
        ]

        if task.actual_hours:
            content_parts.append(f"**Time Spent**: {task.actual_hours} hours")

        if task.estimated_hours and task.actual_hours:
            accuracy = (task.estimated_hours / task.actual_hours) * 100
            content_parts.append(f"**Estimation Accuracy**: {accuracy:.1f}%")

        content_parts.extend([
            "",
            "### What Was Done",
            "",
            task.description,
            "",
            "### Learnings",
            "",
            task.learnings,
        ])

        if task.blockers_encountered:
            content_parts.extend([
                "",
                "### Blockers Encountered",
                "",
            ])
            content_parts.extend(f"- {b}" for b in task.blockers_encountered)

        if task.commit_shas:
            content_parts.extend([
                "",
                "### Related Commits",
                "",
            ])
            content_parts.extend(f"- `{sha}`" for sha in task.commit_shas)

        # Create episode
        episode = Episode(
            id=f"episode_{task.id}",
            entity_type=EntityType.EPISODE,
            name=f"Task Completed: {task.title}",
            description=task.description,
            content="\n".join(content_parts),
            episode_type="task_completion",
            metadata={
                "task_id": task.id,
                "project_id": task.project_id,
                "feature": task.feature,
                "technologies": task.technologies,
                "complexity": task.complexity.value,
                "estimated_hours": task.estimated_hours,
                "actual_hours": task.actual_hours,
                "estimation_accuracy": (
                    task.estimated_hours / task.actual_hours
                    if task.estimated_hours and task.actual_hours
                    else None
                ),
            },
            valid_from=task.completed_at,
        )

        episode_id = await self._entity_manager.create(episode)

        # Link episode back to task
        await self._relationship_manager.create(Relationship(
            id=f"rel_episode_{task.id}",
            source_id=episode_id,
            target_id=task.id,
            relationship_type=RelationshipType.DERIVED_FROM,
        ))

        # Inherit knowledge relationships from task
        task_relationships = await self._relationship_manager.get_for_entity(
            task.id,
            relationship_types=[
                RelationshipType.REQUIRES,
                RelationshipType.REFERENCES,
                RelationshipType.PART_OF,
            ]
        )

        for rel in task_relationships:
            await self._relationship_manager.create(Relationship(
                id=f"rel_episode_{episode_id}_{rel.target_id}",
                source_id=episode_id,
                target_id=rel.target_id,
                relationship_type=RelationshipType.REFERENCES,
                metadata={"inherited_from_task": task.id},
            ))

        log.info("Learning episode created", episode_id=episode_id, task_id=task.id)
        return episode_id

    async def _update_project_progress(self, project_id: str) -> None:
        """Update project progress statistics.

        Args:
            project_id: Project UUID
        """
        log.debug("Updating project progress", project_id=project_id)

        # Query task counts using Cypher
        query = """
        MATCH (p:Project {uuid: $project_id})-[:CONTAINS]->(t:Task)
        WITH p,
             count(t) as total,
             count(CASE WHEN t.status = 'done' THEN 1 END) as done,
             count(CASE WHEN t.status = 'doing' THEN 1 END) as doing
        RETURN total, done, doing
        """

        result = await self._graph_client.client.driver.execute_query(
            query,
            project_id=project_id
        )

        if result and len(result) > 0:
            record = result[0]
            total = record.get("total", 0)
            done = record.get("done", 0)
            doing = record.get("doing", 0)

            # Update project entity
            await self._entity_manager.update(project_id, {
                "total_tasks": total,
                "completed_tasks": done,
                "in_progress_tasks": doing,
            })

            log.debug(
                "Project progress updated",
                project_id=project_id,
                total=total,
                done=done,
                doing=doing
            )

    def _generate_branch_name(self, task: Task) -> str:
        """Generate conventional branch name for task.

        Args:
            task: Task to generate branch for

        Returns:
            Branch name following convention
        """
        # Use first 8 chars of task ID
        task_num = task.id[:8]

        # Slugify title
        slug = task.title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')[:50]

        # Determine prefix based on feature/complexity
        if task.complexity == "epic":
            prefix = "epic"
        elif task.feature:
            prefix = "feature"
        else:
            prefix = "task"

        return f"{prefix}/{task_num}-{slug}"

    def _entity_to_task(self, entity) -> Task:
        """Convert Entity to Task model.

        Args:
            entity: Entity from entity manager

        Returns:
            Task instance
        """
        # Extract task-specific fields from metadata
        return Task(
            id=entity.id,
            entity_type=entity.entity_type,
            title=entity.name,
            description=entity.description,
            name=entity.name,
            content=entity.content,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            # Task-specific fields would be in metadata
            # This is simplified - real implementation would use proper serialization
            **entity.metadata
        )
