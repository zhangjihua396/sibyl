# Sibyl Consolidated Architecture: The Ultimate Knowledge Oracle

**Date**: 2025-12-20
**Status**: Design Phase
**Constraint**: Maximum 4 MCP tools with agent auto-discoverability

---

## Executive Summary

This architecture consolidates all research findings into a unified 4-tool MCP server that transforms Sibyl from a documentation server into the **ultimate knowledge oracle** combining:

1. **Graph-RAG** (Microsoft GraphRAG + Graphiti temporal memory)
2. **Task Management** (Archon-style, but graph-native)
3. **Documentation Crawling** (crawl4ai + trafilatura)
4. **Unified Entity Model** (everything is a knowledge node)

### The 4-Tool Architecture

| Tool | Purpose | Entity Types | Operations |
|------|---------|--------------|------------|
| `search` | Semantic discovery | All entities | Query, filter, rank |
| `explore` | Graph navigation | All entities | List, traverse, relate |
| `add` | Knowledge creation | All entities | Create, link |
| `manage` | Lifecycle & admin | Tasks, projects, sources | Workflow, sync, health |

**Key Insight**: Tasks, projects, documents, and crawled content are **all entity types**. The first 3 tools work uniformly across all entities. The 4th tool handles **stateful operations** that don't fit the read/write pattern.

---

## Part 1: Unified Entity Model

### All Knowledge is Nodes

```
┌─────────────────────────────────────────────────────────────────┐
│                     UNIFIED ENTITY MODEL                         │
└─────────────────────────────────────────────────────────────────┘

Existing Knowledge Entities:
├── pattern       - Coding patterns and best practices
├── rule          - Sacred rules and invariants
├── template      - Code templates and boilerplates
├── topic         - Domain topics and concepts
├── episode       - Temporal knowledge snapshots
├── tool          - Development tools
├── language      - Programming languages
├── config_file   - Configuration patterns
└── slash_command - Claude Code commands

New Entity Types (Task Management):
├── project       - Container for related work
├── task          - Work items with workflow states
├── milestone     - Sprint/milestone groupings
├── team          - Team definitions
└── error_pattern - Recurring errors and solutions

New Entity Types (Documentation):
├── source        - Knowledge source (URL, repo, file path)
├── document      - Crawled/ingested document
└── community     - Auto-detected entity clusters (GraphRAG)
```

### Entity Inheritance

All entities share a common base that enables uniform search/explore:

```python
class Entity(BaseModel):
    """Base entity - all knowledge nodes inherit this."""

    id: str                           # UUID
    entity_type: EntityType           # Discriminator
    name: str                         # Display name
    description: str                  # Short summary
    content: str                      # Full content (searchable)

    # Embedding for semantic search
    embedding: list[float] | None = None

    # Temporal (Graphiti-style)
    created_at: datetime
    updated_at: datetime
    valid_from: datetime | None = None  # When this knowledge became true
    valid_until: datetime | None = None # When superseded

    # Organization
    source_id: str | None = None      # Parent source
    tags: list[str] = []
    metadata: dict[str, Any] = {}
```

---

## Part 2: The 4 MCP Tools

### Tool 1: `search` (Semantic Discovery)

**Purpose**: Find knowledge by meaning across all entity types.

```python
@mcp.tool()
async def search(
    query: str,
    types: list[str] | None = None,        # Filter by entity types
    source: str | None = None,              # Filter by source
    status: str | None = None,              # For tasks: todo/doing/done
    project: str | None = None,             # Filter by project
    assignee: str | None = None,            # For tasks
    language: str | None = None,            # Programming language
    since: str | None = None,               # Temporal filter (ISO date)
    limit: int = 10,
    include_content: bool = True,
) -> SearchResponse:
    """Semantic search across the knowledge graph.

    Search all knowledge types: patterns, rules, templates, tasks,
    projects, documents, episodes, error patterns, and more.

    Examples:
        # Find authentication patterns
        search("OAuth 2.0 implementation", types=["pattern", "template"])

        # Find my open tasks
        search("", types=["task"], status="doing", assignee="alice")

        # Find React documentation
        search("hooks state management", source="react-docs")

        # Find recent learnings
        search("database performance", types=["episode"], since="2025-01-01")

        # Find error solutions
        search("connection timeout redis", types=["error_pattern"])
    """
```

**Implementation Enhancement**:
- Hybrid retrieval (vector + graph traversal)
- Temporal boosting (recent knowledge ranked higher)
- RRF merge for multi-signal ranking

### Tool 2: `explore` (Graph Navigation)

**Purpose**: Browse and traverse the knowledge graph.

```python
@mcp.tool()
async def explore(
    mode: Literal["list", "related", "traverse", "dependencies"] = "list",
    types: list[str] | None = None,
    entity_id: str | None = None,
    relationship_types: list[str] | None = None,
    project: str | None = None,            # For tasks
    status: str | None = None,             # For tasks
    source: str | None = None,             # For documents
    depth: int = 1,
    limit: int = 50,
) -> ExploreResponse:
    """Explore and navigate the knowledge graph.

    Modes:
        - list: Browse entities by type with filters
        - related: Find directly connected entities
        - traverse: Multi-hop graph exploration
        - dependencies: Task dependency chains (for tasks only)

    Examples:
        # List all projects
        explore(mode="list", types=["project"])

        # List tasks in a project
        explore(mode="list", types=["task"], project="proj_abc123")

        # Find knowledge related to a pattern
        explore(mode="related", entity_id="pattern_xyz")

        # Explore from a topic to find all related content
        explore(mode="traverse", entity_id="topic_auth", depth=2)

        # Get task dependency chain
        explore(mode="dependencies", entity_id="task_abc")

        # List documents from a source
        explore(mode="list", types=["document"], source="vercel-docs")
    """
```

**New Mode**: `dependencies` - specialized for task dependency analysis:
- Returns topologically sorted tasks
- Detects circular dependencies
- Shows blocking relationships

### Tool 3: `add` (Knowledge Creation)

**Purpose**: Add new knowledge of any type to the graph.

```python
@mcp.tool()
async def add(
    title: str,
    content: str,
    entity_type: str = "episode",           # Default to episode

    # Organization
    project: str | None = None,             # For tasks: project ID
    source: str | None = None,              # For documents: source ID
    category: str | None = None,
    tags: list[str] | None = None,

    # Task-specific (ignored for other types)
    priority: str | None = None,            # critical/high/medium/low
    assignees: list[str] | None = None,
    due_date: str | None = None,
    technologies: list[str] | None = None,
    depends_on: list[str] | None = None,    # Task IDs

    # Linking
    related_to: list[str] | None = None,    # Entity IDs to link
    auto_link: bool = True,                 # Auto-discover relationships

    metadata: dict[str, Any] | None = None,
) -> AddResponse:
    """Add new knowledge to the graph.

    Creates any entity type and automatically discovers relationships
    based on semantic similarity.

    Entity Types:
        - episode: Temporal knowledge (default) - learnings, discoveries
        - pattern: Coding patterns and best practices
        - task: Work items with workflow states
        - project: Container for related tasks
        - source: Knowledge source for crawling
        - document: Crawled content
        - error_pattern: Error solutions

    Examples:
        # Record a learning
        add("Redis connection pooling insight",
            "Discovered that connection pool needs...",
            category="debugging", technologies=["redis", "python"])

        # Create a task
        add("Implement OAuth login", "Add Google and GitHub OAuth...",
            entity_type="task", project="proj_auth",
            priority="high", assignees=["alice"],
            technologies=["typescript", "oauth2"])

        # Create a project
        add("Authentication System", "Modernize auth with OAuth2...",
            entity_type="project",
            metadata={"repo": "github.com/org/repo"})

        # Add a knowledge source
        add("Vercel Documentation", "https://vercel.com/docs",
            entity_type="source",
            metadata={"crawl_depth": 3, "schedule": "weekly"})

        # Add error pattern
        add("Redis ETIMEDOUT", "Connection timeout during peak load...",
            entity_type="error_pattern",
            metadata={"root_cause": "pool exhaustion",
                      "solution": "increase pool size"})
    """
```

**Auto-Link Feature**: When `auto_link=True` (default):
1. Embeds title + content + technologies
2. Searches for related patterns/rules/templates (threshold 0.75)
3. Creates REFERENCES/REQUIRES relationships automatically
4. Links to domain topics

### Tool 4: `manage` (Lifecycle & Admin)

**Purpose**: Handle stateful operations, workflows, and system administration.

```python
@mcp.tool()
async def manage(
    action: Literal[
        # Task workflow
        "start_task", "block_task", "unblock_task",
        "submit_review", "complete_task", "archive",

        # Source operations
        "crawl", "sync", "refresh",

        # Analysis
        "estimate", "prioritize", "detect_cycles",

        # Admin
        "health", "stats", "rebuild_index"
    ],

    # Target (varies by action)
    entity_id: str | None = None,           # Task/source/project ID
    project: str | None = None,             # For prioritize/detect_cycles

    # Task workflow params
    assignee: str | None = None,            # For start_task
    blocker: str | None = None,             # For block_task
    commits: list[str] | None = None,       # For submit_review
    pr_url: str | None = None,              # For submit_review
    hours: float | None = None,             # For complete_task
    learnings: str | None = None,           # For complete_task

    # Crawl params
    url: str | None = None,                 # For crawl
    depth: int = 2,                         # Crawl depth

) -> ManageResponse:
    """Manage workflows, sync sources, and perform admin operations.

    This is the unified admin/workflow tool handling operations that
    don't fit the search/explore/add pattern.

    TASK WORKFLOW:
        # Start working on a task (auto-generates branch name)
        manage("start_task", entity_id="task_abc", assignee="alice")

        # Record a blocker
        manage("block_task", entity_id="task_abc",
               blocker="Waiting for API access")

        # Unblock
        manage("unblock_task", entity_id="task_abc")

        # Submit for review
        manage("submit_review", entity_id="task_abc",
               commits=["abc123", "def456"],
               pr_url="https://github.com/org/repo/pull/42")

        # Complete with learnings (creates episode automatically)
        manage("complete_task", entity_id="task_abc",
               hours=6.5,
               learnings="OAuth redirect URIs must match exactly...")

        # Archive (close without completing)
        manage("archive", entity_id="task_abc")

    SOURCE OPERATIONS:
        # Crawl a website
        manage("crawl", url="https://vercel.com/docs", depth=3)

        # Sync a source (re-crawl with diff detection)
        manage("sync", entity_id="source_vercel")

        # Refresh all sources
        manage("refresh")

    ANALYSIS:
        # Estimate task effort from similar completed tasks
        manage("estimate", entity_id="task_abc")

        # Get prioritized task list for a project
        manage("prioritize", project="proj_auth")

        # Detect circular dependencies
        manage("detect_cycles", project="proj_auth")

    ADMIN:
        # Health check
        manage("health")

        # Get statistics
        manage("stats")

        # Rebuild search indices
        manage("rebuild_index")
    """
```

---

## Part 3: Agent Auto-Discovery

### Rich Tool Descriptions

Agents auto-discover capabilities through detailed docstrings:

```python
TOOL_DESCRIPTIONS = {
    "search": """
    SEMANTIC SEARCH across the entire knowledge graph.

    Use for:
    ✓ Finding patterns, rules, templates by meaning
    ✓ Discovering tasks by description/status/assignee
    ✓ Querying crawled documentation
    ✓ Finding past learnings and episodes
    ✓ Searching error patterns and solutions

    Key filters:
    - types: pattern, rule, template, task, project, document, episode, error_pattern
    - status: todo, doing, blocked, review, done (for tasks)
    - source: Filter by knowledge source
    - since: Temporal filter
    """,

    "explore": """
    NAVIGATE the knowledge graph structure.

    Use for:
    ✓ Listing all entities of a type
    ✓ Finding related knowledge from a starting point
    ✓ Multi-hop traversal to discover connections
    ✓ Task dependency analysis
    ✓ Browsing documentation by source

    Modes:
    - list: Browse by type (projects, tasks, patterns, etc.)
    - related: Direct neighbors of an entity
    - traverse: Multi-hop exploration (depth 1-3)
    - dependencies: Task dependency chains
    """,

    "add": """
    CREATE new knowledge in the graph.

    Use for:
    ✓ Recording learnings (episodes)
    ✓ Creating tasks and projects
    ✓ Adding patterns and rules
    ✓ Registering knowledge sources
    ✓ Documenting error patterns

    Features:
    - Auto-links to related knowledge (embeddings)
    - Supports all entity types
    - Task-specific fields (priority, assignees, due_date)
    """,

    "manage": """
    WORKFLOW and ADMIN operations.

    Task Workflow:
    ✓ start_task → begin work (auto-generates branch)
    ✓ block_task → record blockers
    ✓ submit_review → link commits and PR
    ✓ complete_task → finish with learnings (creates episode)

    Source Operations:
    ✓ crawl → ingest website/docs
    ✓ sync → refresh source with diff detection

    Analysis:
    ✓ estimate → predict effort from similar tasks
    ✓ prioritize → smart task ordering
    ✓ detect_cycles → find circular dependencies

    Admin:
    ✓ health → system status
    ✓ stats → knowledge graph statistics
    """
}
```

### Example Agent Interaction

```
Agent: I need to find authentication patterns for implementing OAuth.

→ search("OAuth authentication implementation", types=["pattern", "template"])

Agent: Let me also check if there are any related tasks.

→ search("OAuth implementation", types=["task"], status="doing")

Agent: I found a related pattern. Let me see what's connected to it.

→ explore(mode="related", entity_id="pattern_oauth_xyz")

Agent: I should create a task for this work.

→ add("Implement OAuth 2.0 login", "Add Google and GitHub...",
      entity_type="task", project="proj_auth", priority="high",
      technologies=["typescript", "oauth2"])

Agent: Now I'll start working on it.

→ manage("start_task", entity_id="task_abc123", assignee="bliss")

Agent: Done! Let me complete with my learnings.

→ manage("complete_task", entity_id="task_abc123",
         hours=4.5, learnings="OAuth redirect URIs must match exactly...")
```

---

## Part 4: Documentation Crawling

### Source Entity

```python
class Source(Entity):
    """A knowledge source for crawling/ingestion."""

    entity_type: EntityType = EntityType.SOURCE

    # Source details
    url: str                            # Base URL
    source_type: SourceType             # website, github, local

    # Crawl configuration
    crawl_depth: int = 2
    crawl_patterns: list[str] = []      # URL patterns to include
    exclude_patterns: list[str] = []    # URL patterns to exclude

    # Schedule
    schedule: str | None = None         # cron expression
    last_crawled: datetime | None = None

    # Stats
    document_count: int = 0
    total_tokens: int = 0
```

### Crawl Pipeline

```
manage("crawl", url="https://vercel.com/docs", depth=3)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CRAWL PIPELINE                              │
└─────────────────────────────────────────────────────────────────┘

1. URL Discovery (crawl4ai)
   ↓ Extract links, respect robots.txt, depth limit

2. Content Extraction (trafilatura)
   ↓ HTML → Markdown, remove boilerplate

3. Semantic Chunking
   ↓ H2/H3 boundaries, 50-800 words

4. Entity Extraction (LLM)
   ↓ Extract patterns, tools, concepts

5. Embedding Generation
   ↓ OpenAI text-embedding-3-small

6. Graph Storage (FalkorDB)
   ↓ Documents + relationships

7. Community Detection (Leiden)
   ↓ Cluster related documents

8. Summary Generation
   ↓ Community summaries for global queries
```

### Document Entity

```python
class Document(Entity):
    """A crawled/ingested document."""

    entity_type: EntityType = EntityType.DOCUMENT

    # Source reference
    source_id: str
    url: str

    # Content
    title: str
    content: str                        # Full markdown content

    # Hierarchy
    parent_url: str | None = None       # Parent page
    section_path: list[str] = []        # Breadcrumb

    # Extraction results
    extracted_entities: list[str] = []  # Entity IDs found

    # Freshness
    crawled_at: datetime
    content_hash: str                   # For diff detection
```

---

## Part 5: Graph-RAG Enhancements

### Hybrid Retrieval Pipeline

```python
async def hybrid_search(
    query: str,
    entity_types: list[EntityType] | None = None,
    limit: int = 10
) -> list[tuple[Entity, float]]:
    """
    Combine vector search + graph traversal + BM25.
    """

    # 1. Entity linking (find entities mentioned in query)
    query_entities = await entity_linker.link(query)

    # 2. Parallel retrieval strategies
    vector_results, graph_results, keyword_results = await asyncio.gather(
        # Vector search (semantic similarity)
        vector_search(query, entity_types, top_k=30),

        # Graph traversal from linked entities
        graph_traverse(query_entities, depth=2, limit=30),

        # BM25 keyword search (for exact matches)
        bm25_search(query, entity_types, top_k=20)
    )

    # 3. Reciprocal Rank Fusion
    combined = reciprocal_rank_fusion(
        vector_results,
        graph_results,
        keyword_results,
        k=60
    )

    # 4. Temporal boosting (recent knowledge ranks higher)
    boosted = temporal_boost(combined, decay_days=365)

    # 5. Rerank with cross-encoder (optional, for top results)
    reranked = cross_encoder_rerank(query, boosted[:20])

    return reranked[:limit]
```

### Community Detection (Microsoft GraphRAG)

```python
class Community(Entity):
    """Auto-detected cluster of related entities."""

    entity_type: EntityType = EntityType.COMMUNITY

    # Members
    member_ids: list[str]               # Entity IDs in this community
    member_count: int

    # Hierarchy (C0, C1, C2...)
    level: int = 0
    parent_community_id: str | None = None
    child_community_ids: list[str] = []

    # Summary
    summary: str                        # LLM-generated summary
    key_concepts: list[str]             # Main topics

    # Search
    embedding: list[float]              # Summary embedding
```

Community detection enables:
- "Tell me everything about authentication" → Search community summaries
- Hierarchical drill-down (broad → specific)
- Cross-document insights

### LLM Entity Extraction

Upgrade from regex to LLM-based extraction:

```python
async def extract_entities_llm(content: str) -> list[ExtractedEntity]:
    """Extract entities using structured LLM output."""

    response = await llm.generate(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": f"""
            Extract entities from this development content:

            {content}

            Entity types:
            - pattern: Coding pattern or best practice
            - rule: Sacred rule or invariant
            - tool: Library, framework, or tool
            - concept: Abstract concept or principle
            - warning: Gotcha or anti-pattern

            Return JSON: {{
                "entities": [
                    {{"name": "...", "type": "...", "description": "...", "confidence": 0.0-1.0}}
                ]
            }}
            """
        }],
        temperature=0.1
    )

    return parse_entities(response)
```

**Performance**:
- Regex: ~60% recall, ~80% precision
- LLM: ~90% recall, ~88% precision
- Cost: ~$0.02 per document (one-time ingestion)

---

## Part 6: Task Management Integration

### Tasks Work with All Tools

**search** - Find tasks semantically:
```python
# Find my open tasks
search("", types=["task"], status="doing", assignee="alice")

# Find tasks about authentication
search("OAuth implementation", types=["task"])

# Find similar completed tasks
search("implement OAuth login", types=["task"], status="done")
```

**explore** - Navigate task relationships:
```python
# List project tasks
explore(mode="list", types=["task"], project="proj_auth")

# Find knowledge related to a task
explore(mode="related", entity_id="task_abc")

# Get dependency chain
explore(mode="dependencies", entity_id="task_abc")
```

**add** - Create tasks with auto-linking:
```python
add("Implement OAuth login", "Add Google and GitHub OAuth...",
    entity_type="task",
    project="proj_auth",
    priority="high",
    assignees=["alice"],
    technologies=["typescript", "oauth2"],
    auto_link=True)  # Auto-discovers related patterns, rules

# System automatically:
# 1. Embeds task content
# 2. Finds related patterns (similarity > 0.75)
# 3. Creates REFERENCES relationships
# 4. Links to domain topics
```

**manage** - Task workflow operations:
```python
# Full lifecycle
manage("start_task", entity_id="task_abc", assignee="alice")
manage("block_task", entity_id="task_abc", blocker="Waiting for API key")
manage("unblock_task", entity_id="task_abc")
manage("submit_review", entity_id="task_abc", commits=["sha1"], pr_url="...")
manage("complete_task", entity_id="task_abc", hours=4.5,
       learnings="OAuth redirect URIs must match exactly...")

# Analysis
manage("estimate", entity_id="task_abc")  # Predict effort
manage("prioritize", project="proj_auth")  # Smart ordering
```

### Learning Capture

When tasks complete, they become queryable episodes:

```python
# Complete task with learnings
manage("complete_task", entity_id="task_abc",
       hours=4.5,
       learnings="OAuth redirect URIs must match exactly including trailing slashes")

# System automatically:
# 1. Creates Episode entity with task details
# 2. Links episode to task (DERIVED_FROM)
# 3. Inherits task's knowledge relationships
# 4. Extracts error patterns from blockers
# 5. Updates project progress

# Later, query past learnings:
search("OAuth redirect URI issues", types=["episode"])
```

---

## Part 7: Implementation Roadmap

### Phase 1: Entity Model Extension (Week 1)

- [ ] Add new entity types: `project`, `task`, `source`, `document`, `community`
- [ ] Add new relationship types: `CONTAINS`, `DEPENDS_ON`, `CRAWLED_FROM`
- [ ] Update entity base model with unified fields
- [ ] Create graph indices for new types

### Phase 2: Unified Tools (Week 2)

- [ ] Extend `search` with task/project/source filters
- [ ] Add `dependencies` mode to `explore`
- [ ] Extend `add` for all entity types with auto-linking
- [ ] Create `manage` tool with all actions
- [ ] Update tool descriptions for agent discovery

### Phase 3: Crawling Pipeline (Week 3)

- [ ] Integrate crawl4ai for URL discovery
- [ ] Add trafilatura for content extraction
- [ ] Implement semantic chunking for documents
- [ ] Add LLM entity extraction
- [ ] Store documents in graph

### Phase 4: Task Workflow (Week 4)

- [ ] Implement workflow state machine
- [ ] Add branch name generation
- [ ] Create episode from completed tasks
- [ ] Add effort estimation from history
- [ ] Implement dependency detection

### Phase 5: Graph-RAG Enhancements (Week 5-6)

- [ ] Hybrid retrieval (vector + graph + BM25)
- [ ] Temporal boosting
- [ ] RRF merge
- [ ] Community detection (Leiden algorithm)
- [ ] Community summarization

### Phase 6: Polish & Testing (Week 7-8)

- [ ] Performance optimization (caching, batching)
- [ ] Query optimization for common patterns
- [ ] Comprehensive test suite
- [ ] Documentation and examples
- [ ] Agent integration testing

---

## Part 8: Success Metrics

### Retrieval Quality
- NDCG@10 > 0.80 (vs. 0.65 baseline)
- Multi-hop accuracy > 70%
- Task knowledge linking precision > 85%

### Performance
- Search latency P95 < 100ms
- Crawl throughput > 10 pages/minute
- Entity extraction latency < 500ms/document

### Agent Experience
- Tool discovery success > 90%
- Correct tool selection > 85%
- Task workflow completion > 95%

---

## Summary

This architecture achieves the "ultimate knowledge oracle" by:

1. **Unified Entity Model**: Everything is a knowledge node (patterns, tasks, documents)
2. **4 Simple Tools**: search, explore, add, manage - agents auto-discover capabilities
3. **Graph-RAG**: Hybrid retrieval combining vectors, graph traversal, and keywords
4. **Temporal Memory**: Graphiti-style episodic knowledge with versioning
5. **Task Intelligence**: Auto-linking to knowledge, effort estimation, learning capture
6. **Documentation Crawling**: Ingest any docs into the knowledge graph

The key insight: **tasks and documents are just entity types**. They work naturally with the existing search/explore/add pattern. The 4th `manage` tool handles stateful operations that don't fit CRUD.

---

**Files to Modify**:
- `src/sibyl/models/entities.py` - Add entity types
- `src/sibyl/tools/core.py` - Extend search/explore/add
- `src/sibyl/tools/manage.py` - New unified manage tool
- `src/sibyl/server.py` - Register manage tool
- `src/sibyl/crawl/` - New crawling module
- `src/sibyl/tasks/` - Task workflow engine

**Estimated Effort**: 8 weeks for full implementation
**MVP (4 tools + tasks)**: 3 weeks
