"""Task management models for the knowledge graph."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

from sibyl.models.entities import Entity, EntityType


class TaskStatus(StrEnum):
    """Task workflow states."""

    BACKLOG = "backlog"      # Future work, not yet committed
    TODO = "todo"            # Committed to sprint/milestone
    DOING = "doing"          # Active development
    BLOCKED = "blocked"      # Waiting on something
    REVIEW = "review"        # In code review
    DONE = "done"            # Completed and merged
    ARCHIVED = "archived"    # Closed without completion


class TaskPriority(StrEnum):
    """Task priority levels."""

    CRITICAL = "critical"    # P0: System down, blocking everything
    HIGH = "high"            # P1: Important feature, blocking other work
    MEDIUM = "medium"        # P2: Normal priority
    LOW = "low"              # P3: Nice to have
    SOMEDAY = "someday"      # P4: Future consideration


class TaskComplexity(StrEnum):
    """Task complexity for effort estimation."""

    TRIVIAL = "trivial"      # < 30 minutes
    SIMPLE = "simple"        # 30m - 2 hours
    MEDIUM = "medium"        # 2 - 8 hours (1 day)
    COMPLEX = "complex"      # 1 - 3 days
    EPIC = "epic"            # > 3 days (should be broken down)


class Task(Entity):
    """A work item tracked in the knowledge graph."""

    entity_type: EntityType = EntityType.TASK

    # Core task fields
    title: str = Field(..., max_length=200, description="Task title")
    description: str = Field(default="", description="Detailed description")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Current status")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Priority level")
    task_order: int = Field(default=0, description="Order within project (higher = more important)")

    # Project organization
    project_id: str | None = Field(default=None, description="Parent project UUID")
    feature: str | None = Field(default=None, description="Feature area")
    sprint: str | None = Field(default=None, description="Sprint/milestone")

    # Assignment and time
    assignees: list[str] = Field(default_factory=list, description="Assigned team members")
    due_date: datetime | None = Field(default=None, description="Due date")
    estimated_hours: float | None = Field(default=None, description="Estimated effort")
    actual_hours: float | None = Field(default=None, description="Actual time spent")

    # Knowledge integration
    domain: str | None = Field(default=None, description="Knowledge domain (auth, db, api, etc)")
    technologies: list[str] = Field(default_factory=list, description="Technologies involved")
    complexity: TaskComplexity = Field(default=TaskComplexity.MEDIUM, description="Task complexity")

    # Git integration
    branch_name: str | None = Field(default=None, description="Associated Git branch")
    commit_shas: list[str] = Field(default_factory=list, description="Commits implementing this task")
    pr_url: str | None = Field(default=None, description="Pull request URL")

    # Learning capture
    learnings: str = Field(default="", description="What was learned completing this task")
    blockers_encountered: list[str] = Field(default_factory=list, description="Blockers faced")

    # Status timestamps
    started_at: datetime | None = Field(default=None, description="When work started")
    completed_at: datetime | None = Field(default=None, description="When completed")
    reviewed_at: datetime | None = Field(default=None, description="When reviewed")

    @property
    def name(self) -> str:
        """Entity name is the task title."""
        return self.title

    @property
    def content(self) -> str:
        """Entity content is the task description."""
        return self.description


class ProjectStatus(StrEnum):
    """Project lifecycle states."""

    PLANNING = "planning"        # Not started yet
    ACTIVE = "active"            # Active development
    ON_HOLD = "on_hold"          # Paused
    COMPLETED = "completed"      # Finished
    ARCHIVED = "archived"        # Historical record


class Project(Entity):
    """A project containing tasks and tracking overall progress."""

    entity_type: EntityType = EntityType.PROJECT

    # Project metadata
    title: str = Field(..., description="Project name")
    description: str = Field(default="", description="Project description")
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, description="Project status")

    # Organization
    repository_url: str | None = Field(default=None, description="GitHub repo URL")
    features: list[str] = Field(default_factory=list, description="Major feature areas")
    tech_stack: list[str] = Field(default_factory=list, description="Technologies used")

    # Timeline
    start_date: datetime | None = Field(default=None, description="Project start")
    target_date: datetime | None = Field(default=None, description="Target completion")
    completed_date: datetime | None = Field(default=None, description="Actual completion")

    # Progress tracking
    total_tasks: int = Field(default=0, description="Total tasks in project")
    completed_tasks: int = Field(default=0, description="Tasks completed")
    in_progress_tasks: int = Field(default=0, description="Tasks in progress")

    # Knowledge domain
    knowledge_domains: list[str] = Field(
        default_factory=list,
        description="Knowledge domains this project touches"
    )

    # Metadata
    team_members: list[str] = Field(default_factory=list, description="Team member IDs/emails")
    tags: list[str] = Field(default_factory=list, description="Project tags")

    @property
    def name(self) -> str:
        """Entity name is the project title."""
        return self.title

    @property
    def content(self) -> str:
        """Entity content is the project description."""
        return self.description


class Team(Entity):
    """A team of people working together."""

    entity_type: EntityType = EntityType.TEAM

    name: str = Field(..., description="Team name")
    description: str = Field(default="", description="Team description")
    members: list[str] = Field(default_factory=list, description="Team member IDs/emails")
    focus_areas: list[str] = Field(default_factory=list, description="Areas of responsibility")

    @property
    def content(self) -> str:
        """Entity content is the team description."""
        return self.description


class ErrorPattern(Entity):
    """A recurring error pattern and its solution."""

    entity_type: EntityType = EntityType.ERROR_PATTERN

    error_message: str = Field(..., description="Error message or pattern")
    root_cause: str = Field(..., description="Root cause of the error")
    solution: str = Field(..., description="How to fix it")
    prevention: str = Field(default="", description="How to prevent it")

    languages: list[str] = Field(default_factory=list, description="Languages where this occurs")
    technologies: list[str] = Field(default_factory=list, description="Technologies involved")

    occurrence_count: int = Field(default=1, description="How many times encountered")
    last_encountered: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def name(self) -> str:
        """Entity name is truncated error message."""
        return self.error_message[:100]

    @property
    def content(self) -> str:
        """Entity content includes all error details."""
        return f"""Error: {self.error_message}

Root Cause: {self.root_cause}

Solution: {self.solution}

Prevention: {self.prevention}
""".strip()


class Milestone(Entity):
    """A milestone or sprint in project timeline."""

    entity_type: EntityType = EntityType.MILESTONE

    name: str = Field(..., description="Milestone name (e.g., 'Sprint 24', 'v1.0 Release')")
    description: str = Field(default="", description="Milestone description")
    project_id: str = Field(..., description="Parent project UUID")

    start_date: datetime | None = Field(default=None, description="Milestone start")
    end_date: datetime | None = Field(default=None, description="Milestone end")
    target_date: datetime | None = Field(default=None, description="Target completion")

    total_tasks: int = Field(default=0, description="Total tasks in milestone")
    completed_tasks: int = Field(default=0, description="Tasks completed")

    @property
    def content(self) -> str:
        """Entity content is the milestone description."""
        return self.description


class TimeEntry(BaseModel):
    """Time tracking entry for tasks."""

    id: str = Field(default_factory=lambda: str(id(object())), description="Entry ID")
    task_id: str = Field(..., description="Associated task UUID")
    user: str = Field(..., description="User who performed the work")
    duration_minutes: int = Field(..., description="Duration in minutes")
    description: str = Field(default="", description="Work description")
    started_at: datetime = Field(..., description="When work started")
    ended_at: datetime = Field(..., description="When work ended")
    tags: list[str] = Field(default_factory=list, description="Entry tags")


class TaskEstimate(BaseModel):
    """Effort estimation result for a task."""

    estimated_hours: float | None = Field(default=None, description="Estimated hours")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence in estimate")
    based_on_tasks: int = Field(default=0, description="Number of similar tasks used")
    similar_tasks: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Similar tasks used for estimation"
    )
    reason: str = Field(default="", description="Explanation of estimate")


class TaskKnowledgeSuggestion(BaseModel):
    """Suggested knowledge entities for a task."""

    patterns: list[tuple[str, float]] = Field(
        default_factory=list,
        description="Suggested patterns (id, score)"
    )
    rules: list[tuple[str, float]] = Field(
        default_factory=list,
        description="Applicable rules (id, score)"
    )
    templates: list[tuple[str, float]] = Field(
        default_factory=list,
        description="Relevant templates (id, score)"
    )
    past_learnings: list[tuple[str, float]] = Field(
        default_factory=list,
        description="Related episodes (id, score)"
    )
    error_patterns: list[tuple[str, float]] = Field(
        default_factory=list,
        description="Relevant error patterns (id, score)"
    )
