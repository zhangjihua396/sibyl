"""Unified tools for Sibyl MCP Server.

Four consolidated tools: search, explore, add, manage.
Replaces the previous 18+ specific tools with a generic interface.
"""

import hashlib
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal

import structlog

from sibyl.graph.client import get_graph_client
from sibyl.graph.entities import EntityManager
from sibyl.graph.relationships import RelationshipManager
from sibyl.models.entities import EntityType, Episode, Pattern, Relationship, RelationshipType
from sibyl.models.tasks import Task, TaskPriority, TaskStatus, Project, ProjectStatus
from sibyl.tasks.workflow import TaskWorkflowEngine
from sibyl.utils.resilience import TIMEOUTS, with_timeout

log = structlog.get_logger()

# Valid entity types for filtering
VALID_ENTITY_TYPES = {t.value for t in EntityType}

# Validation constants
MAX_TITLE_LENGTH = 200
MAX_CONTENT_LENGTH = 50000


# =============================================================================
# Response Models
# =============================================================================


@dataclass
class SearchResult:
    """A single search result."""

    id: str
    type: str
    name: str
    content: str
    score: float
    source: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResponse:
    """Response from search operation."""

    results: list[SearchResult]
    total: int
    query: str
    filters: dict[str, Any]


@dataclass
class EntitySummary:
    """Summary of an entity for listing."""

    id: str
    type: str
    name: str
    description: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RelatedEntity:
    """An entity related through the graph."""

    id: str
    type: str
    name: str
    relationship: str
    direction: Literal["outgoing", "incoming"]
    distance: int = 1


@dataclass
class ExploreResponse:
    """Response from explore operation."""

    mode: str
    entities: list[EntitySummary] | list[RelatedEntity]
    total: int
    filters: dict[str, Any]


@dataclass
class AddResponse:
    """Response from add operation."""

    success: bool
    id: str | None
    message: str
    timestamp: datetime


# =============================================================================
# TOOL 1: search
# =============================================================================


async def search(
    query: str,
    types: list[str] | None = None,
    language: str | None = None,
    category: str | None = None,
    status: str | None = None,
    project: str | None = None,
    source: str | None = None,
    assignee: str | None = None,
    since: str | None = None,
    limit: int = 10,
    include_content: bool = True,
) -> SearchResponse:
    """Semantic search across the knowledge graph.

    Args:
        query: Natural language search query.
        types: Entity types to search (pattern, rule, template, task, project, etc.).
               If None, searches all types.
        language: Filter by programming language.
        category: Filter by category/topic.
        status: Filter tasks by status (backlog, todo, doing, blocked, review, done).
        project: Filter by project_id.
        source: Filter by source_id (for documents).
        assignee: Filter tasks by assignee.
        since: Temporal filter - ISO date string (e.g., "2024-01-15").
        limit: Maximum results (1-50).
        include_content: Whether to include full content in results.

    Returns:
        SearchResponse with ranked results.
    """
    # Clamp limit
    limit = max(1, min(limit, 50))

    log.info(
        "search",
        query=query[:100],
        types=types,
        language=language,
        category=category,
        status=status,
        project=project,
        assignee=assignee,
        limit=limit,
    )

    filters = {}
    if types:
        filters["types"] = types
    if language:
        filters["language"] = language
    if category:
        filters["category"] = category
    if status:
        filters["status"] = status
    if project:
        filters["project"] = project
    if source:
        filters["source"] = source
    if assignee:
        filters["assignee"] = assignee
    if since:
        filters["since"] = since

    try:
        client = await get_graph_client()
        entity_manager = EntityManager(client)

        # Determine entity types to search
        entity_types = None
        if types:
            entity_types = []
            for t in types:
                if t.lower() in VALID_ENTITY_TYPES:
                    entity_types.append(EntityType(t.lower()))
                else:
                    log.warning("unknown_entity_type", type=t)

        # Parse since date if provided
        since_date = None
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace("Z", "+00:00"))
            except ValueError:
                log.warning("invalid_since_date", since=since)

        # Perform semantic search
        raw_results = await with_timeout(
            entity_manager.search(
                query=query,
                entity_types=entity_types,
                limit=limit * 3,  # Over-fetch for filtering
            ),
            timeout_seconds=TIMEOUTS["search"],
            operation_name="search",
        )

        results = []
        for entity, score in raw_results:
            # Apply language filter
            if language:
                entity_langs = getattr(entity, "languages", None) or entity.metadata.get("languages", [])
                if language.lower() not in [l.lower() for l in entity_langs]:
                    continue

            # Apply category filter
            if category:
                entity_cat = getattr(entity, "category", "") or entity.metadata.get("category", "")
                if category.lower() not in entity_cat.lower():
                    continue

            # Apply status filter (for tasks)
            if status:
                entity_status = getattr(entity, "status", None)
                if entity_status is None:
                    entity_status = entity.metadata.get("status")
                if entity_status is None:
                    continue
                # Handle both enum and string status
                status_val = entity_status.value if hasattr(entity_status, "value") else str(entity_status)
                if status.lower() != status_val.lower():
                    continue

            # Apply project filter
            if project:
                entity_project = getattr(entity, "project_id", None) or entity.metadata.get("project_id")
                if entity_project != project:
                    continue

            # Apply source filter
            if source:
                entity_source = getattr(entity, "source_id", None) or entity.metadata.get("source_id")
                if entity_source != source:
                    continue

            # Apply assignee filter (for tasks)
            if assignee:
                entity_assignees = getattr(entity, "assignees", None) or entity.metadata.get("assignees", [])
                if assignee.lower() not in [a.lower() for a in entity_assignees]:
                    continue

            # Apply temporal filter
            if since_date:
                entity_created = getattr(entity, "created_at", None) or entity.metadata.get("created_at")
                if entity_created:
                    try:
                        if isinstance(entity_created, str):
                            entity_created = datetime.fromisoformat(entity_created.replace("Z", "+00:00"))
                        if entity_created < since_date:
                            continue
                    except (ValueError, TypeError):
                        pass  # Skip temporal filter if date parsing fails

            # Build content based on include_content flag
            if include_content:
                content = entity.content[:500] if entity.content else entity.description
            else:
                content = entity.description[:200] if entity.description else ""

            # Extract status value for serialization
            raw_status = getattr(entity, "status", None) or entity.metadata.get("status")
            status_value = raw_status.value if hasattr(raw_status, "value") else raw_status

            # Extract priority value for serialization
            raw_priority = getattr(entity, "priority", None) or entity.metadata.get("priority")
            priority_value = raw_priority.value if hasattr(raw_priority, "value") else raw_priority

            results.append(
                SearchResult(
                    id=entity.id,
                    type=entity.entity_type.value,
                    name=entity.name,
                    content=content or "",
                    score=score,
                    source=entity.source_file,
                    metadata={
                        **entity.metadata,
                        **{
                            k: v
                            for k, v in {
                                "category": getattr(entity, "category", None) or entity.metadata.get("category"),
                                "languages": getattr(entity, "languages", None) or entity.metadata.get("languages"),
                                "severity": getattr(entity, "severity", None) or entity.metadata.get("severity"),
                                "status": status_value,
                                "priority": priority_value,
                                "project_id": getattr(entity, "project_id", None) or entity.metadata.get("project_id"),
                                "assignees": getattr(entity, "assignees", None) or entity.metadata.get("assignees"),
                            }.items()
                            if v is not None
                        },
                    },
                )
            )

            if len(results) >= limit:
                break

        return SearchResponse(
            results=results,
            total=len(results),
            query=query,
            filters=filters,
        )

    except Exception as e:
        log.warning("search_failed", error=str(e))
        return SearchResponse(results=[], total=0, query=query, filters=filters)


# =============================================================================
# TOOL 2: explore
# =============================================================================


async def explore(
    mode: Literal["list", "related", "traverse", "dependencies"] = "list",
    types: list[str] | None = None,
    entity_id: str | None = None,
    relationship_types: list[str] | None = None,
    depth: int = 1,
    language: str | None = None,
    category: str | None = None,
    project: str | None = None,
    status: str | None = None,
    limit: int = 50,
) -> ExploreResponse:
    """Explore and browse the knowledge graph.

    Modes:
        - list: Browse entities by type with optional filters
        - related: Find entities connected to a specific entity
        - traverse: Multi-hop graph traversal from an entity
        - dependencies: Task dependency chains (topologically sorted)

    Args:
        mode: Exploration mode.
        types: Entity types to explore (for list mode).
        entity_id: Starting entity for related/traverse/dependencies modes.
        relationship_types: Filter by relationship types (for related/traverse).
        depth: Traversal depth for traverse mode (1-3).
        language: Filter by language.
        category: Filter by category.
        project: Filter by project_id (for tasks).
        status: Filter by task status (backlog, todo, doing, etc.).
        limit: Maximum results.

    Returns:
        ExploreResponse with entities or relationships.
    """
    # Clamp values
    limit = max(1, min(limit, 200))
    depth = max(1, min(depth, 3))

    log.info(
        "explore",
        mode=mode,
        types=types,
        entity_id=entity_id,
        project=project,
        status=status,
        depth=depth,
    )

    filters = {}
    if types:
        filters["types"] = types
    if language:
        filters["language"] = language
    if category:
        filters["category"] = category
    if entity_id:
        filters["entity_id"] = entity_id
    if project:
        filters["project"] = project
    if status:
        filters["status"] = status

    try:
        if mode == "dependencies":
            return await _explore_dependencies(
                entity_id=entity_id,
                project=project,
                limit=limit,
                filters=filters,
            )
        if mode in ("related", "traverse"):
            return await _explore_related(
                entity_id=entity_id,
                relationship_types=relationship_types,
                depth=depth if mode == "traverse" else 1,
                limit=limit,
                filters=filters,
                mode=mode,
            )
        return await _explore_list(
            types=types,
            language=language,
            category=category,
            project=project,
            status=status,
            limit=limit,
            filters=filters,
        )

    except Exception as e:
        log.warning("explore_failed", error=str(e), mode=mode)
        return ExploreResponse(mode=mode, entities=[], total=0, filters=filters)


async def _explore_list(
    types: list[str] | None,
    language: str | None,
    category: str | None,
    project: str | None,
    status: str | None,
    limit: int,
    filters: dict[str, Any],
) -> ExploreResponse:
    """List entities by type with filters."""
    client = await get_graph_client()
    entity_manager = EntityManager(client)

    # Default to listing all types if none specified
    target_types = []
    if types:
        for t in types:
            if t.lower() in VALID_ENTITY_TYPES:
                target_types.append(EntityType(t.lower()))
    else:
        # Default to common browsable types
        target_types = [
            EntityType.PATTERN,
            EntityType.RULE,
            EntityType.TEMPLATE,
            EntityType.TOPIC,
        ]

    all_entities = []
    for entity_type in target_types:
        entities = await entity_manager.list_by_type(entity_type, limit=limit * 2)  # Over-fetch for filtering
        all_entities.extend(entities)

    # Apply filters and convert to summaries
    results = []
    for entity in all_entities:
        # Language filter
        if language:
            entity_langs = getattr(entity, "languages", None) or entity.metadata.get("languages", [])
            if language.lower() not in [l.lower() for l in entity_langs]:
                continue

        # Category filter
        if category:
            entity_cat = getattr(entity, "category", "") or entity.metadata.get("category", "")
            if category.lower() not in entity_cat.lower():
                continue

        # Project filter (for tasks)
        if project:
            entity_project = getattr(entity, "project_id", None) or entity.metadata.get("project_id")
            if entity_project != project:
                continue

        # Status filter (for tasks)
        if status:
            entity_status = getattr(entity, "status", None)
            if entity_status is None:
                entity_status = entity.metadata.get("status")
            if entity_status is None:
                continue
            status_val = entity_status.value if hasattr(entity_status, "value") else str(entity_status)
            if status.lower() != status_val.lower():
                continue

        # Extract status/priority for serialization
        raw_status = getattr(entity, "status", None) or entity.metadata.get("status")
        status_value = raw_status.value if hasattr(raw_status, "value") else raw_status
        raw_priority = getattr(entity, "priority", None) or entity.metadata.get("priority")
        priority_value = raw_priority.value if hasattr(raw_priority, "value") else raw_priority

        results.append(
            EntitySummary(
                id=entity.id,
                type=entity.entity_type.value,
                name=entity.name,
                description=entity.description[:200] if entity.description else "",
                metadata={
                    **entity.metadata,
                    **{
                        k: v
                        for k, v in {
                            "category": getattr(entity, "category", None) or entity.metadata.get("category"),
                            "languages": getattr(entity, "languages", None) or entity.metadata.get("languages"),
                            "severity": getattr(entity, "severity", None) or entity.metadata.get("severity"),
                            "template_type": getattr(entity, "template_type", None) or entity.metadata.get("template_type"),
                            "status": status_value,
                            "priority": priority_value,
                            "project_id": getattr(entity, "project_id", None) or entity.metadata.get("project_id"),
                            "assignees": getattr(entity, "assignees", None) or entity.metadata.get("assignees"),
                        }.items()
                        if v is not None
                    },
                },
            )
        )

        if len(results) >= limit:
            break

    return ExploreResponse(
        mode="list",
        entities=results,
        total=len(results),
        filters=filters,
    )


@dataclass
class DependencyNode:
    """A task in a dependency chain."""

    id: str
    name: str
    status: str | None
    depth: int  # Distance from root task
    is_blocking: bool  # True if this blocks the root task


async def _explore_dependencies(
    entity_id: str | None,
    project: str | None,
    limit: int,
    filters: dict[str, Any],
) -> ExploreResponse:
    """Traverse task dependency chains with topological sorting.

    Returns tasks in dependency order (dependencies before dependents).
    Detects and reports circular dependencies.
    """
    if not entity_id:
        return ExploreResponse(
            mode="dependencies",
            entities=[],
            total=0,
            filters={**filters, "error": "entity_id required for dependencies mode"},
        )

    client = await get_graph_client()
    relationship_manager = RelationshipManager(client)
    entity_manager = EntityManager(client)

    # Track visited nodes and detect cycles
    visited: set[str] = set()
    in_stack: set[str] = set()  # For cycle detection
    dependency_order: list[tuple[str, int]] = []  # (entity_id, depth)
    circular_deps: list[tuple[str, str]] = []  # Detected cycles

    async def traverse_dependencies(task_id: str, depth: int = 0) -> None:
        """DFS traversal to build dependency order."""
        if task_id in in_stack:
            # Cycle detected
            circular_deps.append((entity_id or "", task_id))
            return

        if task_id in visited:
            return

        visited.add(task_id)
        in_stack.add(task_id)

        # Get DEPENDS_ON relationships (tasks this task depends on)
        deps = await relationship_manager.get_related_entities(
            entity_id=task_id,
            relationship_types=[RelationshipType.DEPENDS_ON],
            depth=1,
            limit=100,
        )

        for dep_entity, rel in deps:
            # Only follow outgoing DEPENDS_ON (this task depends on dep_entity)
            if rel.source_id == task_id:
                # Apply project filter if specified
                if project:
                    dep_project = getattr(dep_entity, "project_id", None) or dep_entity.metadata.get("project_id")
                    if dep_project != project:
                        continue
                await traverse_dependencies(dep_entity.id, depth + 1)

        in_stack.remove(task_id)
        dependency_order.append((task_id, depth))

    # Start traversal from the given entity
    await traverse_dependencies(entity_id)

    # dependency_order is in reverse topological order (dependencies first)
    # Reverse it so dependencies come first
    dependency_order.reverse()

    # Build result entities
    results: list[EntitySummary] = []
    for task_id, depth in dependency_order[:limit]:
        try:
            entity = await entity_manager.get(task_id)
            if entity:
                raw_status = getattr(entity, "status", None) or entity.metadata.get("status")
                status_value = raw_status.value if hasattr(raw_status, "value") else raw_status

                results.append(
                    EntitySummary(
                        id=entity.id,
                        type=entity.entity_type.value,
                        name=entity.name,
                        description=entity.description[:200] if entity.description else "",
                        metadata={
                            "status": status_value,
                            "depth": depth,
                            "is_root": entity.id == entity_id,
                            "project_id": getattr(entity, "project_id", None) or entity.metadata.get("project_id"),
                        },
                    )
                )
        except Exception:
            log.warning("dependency_entity_fetch_failed", task_id=task_id)

    # Add circular dependency warning to filters if detected
    result_filters = {**filters}
    if circular_deps:
        result_filters["circular_dependencies"] = [
            {"from": c[0], "to": c[1]} for c in circular_deps
        ]
        result_filters["warning"] = "Circular dependencies detected"

    return ExploreResponse(
        mode="dependencies",
        entities=results,
        total=len(results),
        filters=result_filters,
    )


async def _explore_related(
    entity_id: str | None,
    relationship_types: list[str] | None,
    depth: int,
    limit: int,
    filters: dict[str, Any],
    mode: str,
) -> ExploreResponse:
    """Find related entities via graph traversal."""
    if not entity_id:
        return ExploreResponse(
            mode=mode,
            entities=[],
            total=0,
            filters={**filters, "error": "entity_id required for related/traverse mode"},
        )

    client = await get_graph_client()
    relationship_manager = RelationshipManager(client)

    # Convert relationship type strings to enum
    rel_types = None
    if relationship_types:
        rel_types = []
        for rt in relationship_types:
            try:
                rel_types.append(RelationshipType(rt.upper()))
            except ValueError:
                log.warning("unknown_relationship_type", type=rt)

    # Get related entities
    raw_results = await relationship_manager.get_related_entities(
        entity_id=entity_id,
        relationship_types=rel_types,
        depth=depth,
        limit=limit,
    )

    results = []
    for entity, relationship in raw_results:
        direction: Literal["outgoing", "incoming"] = (
            "outgoing" if relationship.source_id == entity_id else "incoming"
        )

        results.append(
            RelatedEntity(
                id=entity.id,
                type=entity.entity_type.value,
                name=entity.name,
                relationship=relationship.relationship_type.value,
                direction=direction,
                distance=1,  # Would need path info for multi-hop
            )
        )

    return ExploreResponse(
        mode=mode,
        entities=results,
        total=len(results),
        filters=filters,
    )


# =============================================================================
# TOOL 3: add
# =============================================================================


async def add(
    title: str,
    content: str,
    entity_type: str = "episode",
    category: str | None = None,
    languages: list[str] | None = None,
    tags: list[str] | None = None,
    related_to: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
    # Task-specific parameters
    project: str | None = None,
    priority: str | None = None,
    assignees: list[str] | None = None,
    due_date: str | None = None,
    technologies: list[str] | None = None,
    depends_on: list[str] | None = None,
    # Project-specific parameters
    repository_url: str | None = None,
) -> AddResponse:
    """Add new knowledge to the graph.

    Args:
        title: Short title for the knowledge.
        content: Full content/description.
        entity_type: Type of entity to create (episode, pattern, task, project).
        category: Category for organization.
        languages: Applicable programming languages.
        tags: Searchable tags.
        related_to: IDs of related entities to link.
        metadata: Additional structured metadata.
        project: Project ID for task entities.
        priority: Task priority (critical, high, medium, low, someday).
        assignees: List of assignees for tasks.
        due_date: Due date for tasks (ISO format string).
        technologies: Technologies involved (for tasks).
        depends_on: Task IDs this task depends on (creates DEPENDS_ON relationships).
        repository_url: Repository URL for projects.

    Returns:
        AddResponse indicating success or failure.
    """
    # Sanitize inputs
    title = title.strip()
    content = content.strip()

    # Validate
    if not title:
        return AddResponse(
            success=False,
            id=None,
            message="Title cannot be empty",
            timestamp=datetime.now(UTC),
        )

    if len(title) > MAX_TITLE_LENGTH:
        return AddResponse(
            success=False,
            id=None,
            message=f"Title exceeds {MAX_TITLE_LENGTH} characters",
            timestamp=datetime.now(UTC),
        )

    if not content:
        return AddResponse(
            success=False,
            id=None,
            message="Content cannot be empty",
            timestamp=datetime.now(UTC),
        )

    if len(content) > MAX_CONTENT_LENGTH:
        return AddResponse(
            success=False,
            id=None,
            message=f"Content exceeds {MAX_CONTENT_LENGTH} characters",
            timestamp=datetime.now(UTC),
        )

    log.info(
        "add",
        title=title[:50],
        entity_type=entity_type,
        category=category,
        languages=languages,
    )

    try:
        client = await get_graph_client()
        entity_manager = EntityManager(client)

        # Generate deterministic ID
        entity_id = _generate_id(entity_type, title, category or "general")

        # Merge metadata
        full_metadata = {
            "category": category,
            "languages": languages or [],
            "tags": tags or [],
            "added_at": datetime.now(UTC).isoformat(),
            **(metadata or {}),
        }

        # Create appropriate entity type
        entity: Episode | Pattern | Task | Project
        relationship_manager = RelationshipManager(client)

        if entity_type == "task":
            # Parse due date if provided
            parsed_due_date = None
            if due_date:
                try:
                    parsed_due_date = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
                except ValueError:
                    log.warning("invalid_due_date", due_date=due_date)

            # Parse priority
            task_priority = TaskPriority.MEDIUM
            if priority:
                try:
                    task_priority = TaskPriority(priority.lower())
                except ValueError:
                    log.warning("invalid_priority", priority=priority)

            entity = Task(
                id=entity_id,
                title=title,
                description=content,
                status=TaskStatus.TODO,
                priority=task_priority,
                project_id=project,
                assignees=assignees or [],
                due_date=parsed_due_date,
                technologies=technologies or languages or [],
                domain=category,
                metadata=full_metadata,
            )

        elif entity_type == "project":
            entity = Project(
                id=entity_id,
                name=title,
                description=content,
                status=ProjectStatus.ACTIVE,
                repository_url=repository_url,
                technologies=technologies or languages or [],
                domain=category,
                metadata=full_metadata,
            )

        elif entity_type == "pattern":
            entity = Pattern(
                id=entity_id,
                entity_type=EntityType.PATTERN,
                name=title,
                description=content[:500] if len(content) > 500 else content,
                content=content,
                category=category or "",
                languages=languages or [],
                metadata=full_metadata,
            )

        else:
            # Default to Episode for temporal knowledge
            entity = Episode(
                id=entity_id,
                entity_type=EntityType.EPISODE,
                name=title,
                description=content[:500] if len(content) > 500 else content,
                content=content,
                metadata=full_metadata,
            )

        # Store in graph
        created_id = await entity_manager.create(entity)

        # Create relationships
        relationships_created = []

        # Task -> Project (BELONGS_TO)
        if entity_type == "task" and project:
            try:
                rel = Relationship(
                    id=f"rel_{created_id}_belongs_to_{project}",
                    source_id=created_id,
                    target_id=project,
                    relationship_type=RelationshipType.BELONGS_TO,
                    metadata={"created_at": datetime.now(UTC).isoformat()},
                )
                await relationship_manager.create(rel)
                relationships_created.append(f"BELONGS_TO:{project}")
            except Exception as e:
                log.warning("relationship_creation_failed", error=str(e), type="BELONGS_TO")

        # Task -> Task (DEPENDS_ON)
        if entity_type == "task" and depends_on:
            for dep_id in depends_on:
                try:
                    rel = Relationship(
                        id=f"rel_{created_id}_depends_on_{dep_id}",
                        source_id=created_id,
                        target_id=dep_id,
                        relationship_type=RelationshipType.DEPENDS_ON,
                        metadata={"created_at": datetime.now(UTC).isoformat()},
                    )
                    await relationship_manager.create(rel)
                    relationships_created.append(f"DEPENDS_ON:{dep_id}")
                except Exception as e:
                    log.warning("relationship_creation_failed", error=str(e), type="DEPENDS_ON", target=dep_id)

        # Generic RELATED_TO relationships
        if related_to:
            for related_id in related_to:
                try:
                    rel = Relationship(
                        id=f"rel_{created_id}_related_to_{related_id}",
                        source_id=created_id,
                        target_id=related_id,
                        relationship_type=RelationshipType.RELATED_TO,
                        metadata={"created_at": datetime.now(UTC).isoformat()},
                    )
                    await relationship_manager.create(rel)
                    relationships_created.append(f"RELATED_TO:{related_id}")
                except Exception as e:
                    log.warning("relationship_creation_failed", error=str(e), type="RELATED_TO", target=related_id)

        message = f"Added: {title}"
        if relationships_created:
            message += f" (linked: {len(relationships_created)})"

        return AddResponse(
            success=True,
            id=created_id,
            message=message,
            timestamp=datetime.now(UTC),
        )

    except Exception as e:
        log.warning("add_failed", error=str(e))
        return AddResponse(
            success=False,
            id=None,
            message=f"Failed: {e}",
            timestamp=datetime.now(UTC),
        )


def _generate_id(prefix: str, *parts: str) -> str:
    """Generate a deterministic entity ID."""
    combined = ":".join(str(p)[:100] for p in parts)
    hash_bytes = hashlib.sha256(combined.encode()).hexdigest()[:12]
    return f"{prefix}_{hash_bytes}"


# =============================================================================
# TOOL 4: manage
# =============================================================================


@dataclass
class ManageResponse:
    """Response from manage operation."""

    success: bool
    action: str
    entity_id: str | None
    message: str
    data: dict[str, Any] = field(default_factory=dict)


async def manage(
    action: Literal[
        "start_task",
        "block_task",
        "unblock_task",
        "submit_review",
        "complete_task",
        "archive",
        "health",
    ],
    entity_id: str | None = None,
    # Task workflow parameters
    assignee: str | None = None,
    blocker: str | None = None,
    commit_shas: list[str] | None = None,
    pr_url: str | None = None,
    actual_hours: float | None = None,
    learnings: str | None = None,
) -> ManageResponse:
    """Manage task workflows and system operations.

    Actions:
        - start_task: Begin work on a task (sets status=doing, generates branch)
        - block_task: Mark task as blocked with reason
        - unblock_task: Resume blocked task
        - submit_review: Submit task for review with commits/PR
        - complete_task: Mark task as done with learnings
        - archive: Archive a task or entity
        - health: Get system health status

    Args:
        action: The management action to perform.
        entity_id: Task or entity ID (required for task actions).
        assignee: User starting the task (for start_task).
        blocker: Description of blocker (for block_task).
        commit_shas: Git commit SHAs (for submit_review).
        pr_url: Pull request URL (for submit_review).
        actual_hours: Time spent (for complete_task).
        learnings: What was learned (for complete_task).

    Returns:
        ManageResponse with action result.
    """
    log.info(
        "manage",
        action=action,
        entity_id=entity_id,
    )

    try:
        # Health check doesn't need entity_id
        if action == "health":
            health_data = await get_health()
            return ManageResponse(
                success=True,
                action=action,
                entity_id=None,
                message=f"System status: {health_data.get('status', 'unknown')}",
                data=health_data,
            )

        # All other actions require entity_id
        if not entity_id:
            return ManageResponse(
                success=False,
                action=action,
                entity_id=None,
                message="entity_id is required for this action",
            )

        client = await get_graph_client()
        entity_manager = EntityManager(client)
        relationship_manager = RelationshipManager(client)
        workflow = TaskWorkflowEngine(entity_manager, relationship_manager, client)

        if action == "start_task":
            if not assignee:
                return ManageResponse(
                    success=False,
                    action=action,
                    entity_id=entity_id,
                    message="assignee is required for start_task",
                )
            task = await workflow.start_task(entity_id, assignee)
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message=f"Task started: {task.title}",
                data={
                    "status": task.status.value,
                    "branch_name": task.branch_name,
                    "assignees": task.assignees,
                    "started_at": task.started_at.isoformat() if task.started_at else None,
                },
            )

        elif action == "block_task":
            if not blocker:
                return ManageResponse(
                    success=False,
                    action=action,
                    entity_id=entity_id,
                    message="blocker description is required for block_task",
                )
            task = await workflow.block_task(entity_id, blocker)
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message=f"Task blocked: {blocker}",
                data={
                    "status": task.status.value,
                    "blockers": task.blockers_encountered,
                },
            )

        elif action == "unblock_task":
            task = await workflow.unblock_task(entity_id)
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message="Task unblocked",
                data={"status": task.status.value},
            )

        elif action == "submit_review":
            task = await workflow.submit_for_review(
                entity_id,
                commit_shas=commit_shas or [],
                pr_url=pr_url,
            )
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message="Task submitted for review",
                data={
                    "status": task.status.value,
                    "pr_url": task.pr_url,
                    "commit_shas": task.commit_shas,
                },
            )

        elif action == "complete_task":
            task = await workflow.complete_task(
                entity_id,
                actual_hours=actual_hours,
                learnings=learnings or "",
            )
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message=f"Task completed: {task.title}",
                data={
                    "status": task.status.value,
                    "actual_hours": task.actual_hours,
                    "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                    "learnings_captured": bool(learnings),
                },
            )

        elif action == "archive":
            # Generic archive - update status to archived
            await entity_manager.update(entity_id, {"status": TaskStatus.ARCHIVED})
            return ManageResponse(
                success=True,
                action=action,
                entity_id=entity_id,
                message="Entity archived",
                data={"status": "archived"},
            )

        else:
            return ManageResponse(
                success=False,
                action=action,
                entity_id=entity_id,
                message=f"Unknown action: {action}",
            )

    except Exception as e:
        log.warning("manage_failed", error=str(e), action=action)
        return ManageResponse(
            success=False,
            action=action,
            entity_id=entity_id,
            message=f"Failed: {e}",
        )


# Resource functions (Admin-only, exposed as MCP resources)

# Module-level state for uptime tracking
_server_start_time: float | None = None


async def get_health() -> dict[str, Any]:
    """Get server health status."""
    import time

    from sibyl.config import settings

    global _server_start_time  # noqa: PLW0603
    if _server_start_time is None:
        _server_start_time = time.time()

    health = {
        "status": "unknown",
        "server_name": settings.server_name,
        "uptime_seconds": int(time.time() - _server_start_time),
        "graph_connected": False,
        "entity_counts": {},
        "errors": [],
    }

    try:
        client = await get_graph_client()
        entity_manager = EntityManager(client)

        # Test connectivity
        health["graph_connected"] = True

        # Get entity counts
        for entity_type in [EntityType.PATTERN, EntityType.RULE, EntityType.EPISODE]:
            try:
                entities = await entity_manager.list_by_type(entity_type, limit=1000)
                health["entity_counts"][entity_type.value] = len(entities)
            except Exception:
                health["entity_counts"][entity_type.value] = -1

        health["status"] = "healthy"

    except Exception as e:
        health["status"] = "unhealthy"
        health["errors"].append(str(e))

    return health


async def get_stats() -> dict[str, Any]:
    """Get knowledge graph statistics."""
    try:
        client = await get_graph_client()
        entity_manager = EntityManager(client)

        stats = {
            "entity_counts": {},
            "total_entities": 0,
        }

        for entity_type in EntityType:
            try:
                entities = await entity_manager.list_by_type(entity_type, limit=10000)
                count = len(entities)
                stats["entity_counts"][entity_type.value] = count
                stats["total_entities"] += count
            except Exception:
                stats["entity_counts"][entity_type.value] = 0

        return stats

    except Exception as e:
        return {"error": str(e), "entity_counts": {}, "total_entities": 0}
