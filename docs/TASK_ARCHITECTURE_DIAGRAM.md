# Task Management System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TASK MANAGEMENT LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐              ┌──────────────────┐             │
│  │ TaskManager      │              │ WorkflowEngine   │             │
│  ├──────────────────┤              ├──────────────────┤             │
│  │ • create()       │              │ • start_task()   │             │
│  │ • suggest()      │              │ • submit()       │             │
│  │ • find_similar() │              │ • complete()     │             │
│  │ • estimate()     │              │ • block()        │             │
│  └────────┬─────────┘              └────────┬─────────┘             │
│           │                                 │                        │
│           └────────────┬────────────────────┘                        │
│                        │                                             │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────────────┐
│                     KNOWLEDGE GRAPH LAYER                            │
├────────────────────────┼─────────────────────────────────────────────┤
│                        ▼                                             │
│  ┌──────────────────────────────────────────────────────┐           │
│  │              Entity Manager                           │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │ • create(entity)                                      │           │
│  │ • get(id)                                             │           │
│  │ • search(query, types) → [(entity, score)]           │           │
│  │ • update(id, changes)                                 │           │
│  └──────────────────────────────┬───────────────────────┘           │
│                                  │                                   │
│  ┌──────────────────────────────┴───────────────────────┐           │
│  │           Relationship Manager                        │           │
│  ├──────────────────────────────────────────────────────┤           │
│  │ • create(relationship)                                │           │
│  │ • get_for_entity(id, types, direction)               │           │
│  │ • get_related_entities(id, depth)                    │           │
│  └──────────────────────────────┬───────────────────────┘           │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
┌──────────────────────────────────┼───────────────────────────────────┐
│                         GRAPH DATABASE                               │
├──────────────────────────────────┼───────────────────────────────────┤
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────┐             │
│  │                Graphiti + FalkorDB                  │             │
│  ├────────────────────────────────────────────────────┤             │
│  │ • Entity Nodes (with embeddings)                   │             │
│  │ • Relationship Edges (typed, weighted)             │             │
│  │ • Semantic Search (vector similarity)              │             │
│  │ • Graph Traversal (Cypher queries)                 │             │
│  └────────────────────────────────────────────────────┘             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Entity Relationships Graph

```
                    ┌─────────────┐
                    │   Project   │
                    └──────┬──────┘
                           │
                 ┌─────────┼─────────┐
                 │                   │
          CONTAINS │                 │ INVOLVES
                 │                   │
         ┌───────▼──────┐      ┌────▼─────┐
         │     Task     │      │  Topic   │
         └───────┬──────┘      └──────────┘
                 │
      ┌──────────┼──────────┬──────────┬──────────┐
      │          │          │          │          │
  REFERENCES  REQUIRES  DEPENDS_ON  ASSIGNED_TO  PART_OF
      │          │          │          │          │
  ┌───▼───┐  ┌──▼──┐   ┌───▼───┐  ┌──▼────┐  ┌──▼──────┐
  │Pattern│  │Rule │   │ Task  │  │Person │  │ Feature │
  └───────┘  └─────┘   └───────┘  └───────┘  └─────────┘
      │
      │ DOCUMENTED_IN
      │
  ┌───▼──────────┐
  │ KnowledgeSrc │
  └──────────────┘

  When Task completes:
  ┌──────────┐ DERIVED_FROM ┌─────────┐
  │ Episode  │◄─────────────│  Task   │
  └────┬─────┘              └─────────┘
       │
       │ REFERENCES (inherited)
       │
  ┌────▼───────┐
  │  Pattern   │
  └────────────┘
```

## Task Lifecycle State Machine

```
                         ┌─────────┐
                    ┌───►│ backlog │
                    │    └────┬────┘
                    │         │
                    │         │ prioritize
                    │         ▼
                    │    ┌─────────┐
                    │    │  todo   │◄────────────┐
                    │    └────┬────┘             │
         deprioritize │         │                 │
                    │         │ start_task()     │
                    │         ▼                  │
                    │    ┌─────────┐             │
                    └────┤  doing  │             │
                         └────┬────┘             │
                              │                  │
           ┌──────────────────┼──────────┐       │
           │                  │          │       │
    block_task()    submit_for_review()  │       │
           │                  │    unblock_task()│
           ▼                  ▼          │       │
      ┌─────────┐        ┌────────┐     │       │
      │ blocked │        │ review │     │       │
      └────┬────┘        └───┬────┘     │       │
           │                 │          │       │
           └─────────────────┤──────────┘       │
                             │                  │
                    complete_task()             │
                             │                  │
                             ▼                  │
                        ┌─────────┐             │
                        │  done   │             │
                        └─────────┘             │
                             │                  │
                     Creates Episode            │
                             │                  │
                             ▼                  │
                      [Knowledge Graph]         │
                                                │
                        ┌─────────┐             │
               ┌───────►│archived │─────────────┘
               │        └─────────┘
        archive_task()
```

## Knowledge Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   1. TASK CREATION                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Embed task      │
                    │  title + desc    │
                    └────────┬─────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. SEMANTIC SEARCH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Patterns │  │  Rules   │  │Templates │  │ Episodes │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │              │              │             │
│       └─────────────┴──────────────┴──────────────┘             │
│                             │                                   │
│                 Find similar via cosine(embedding)              │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   3. AUTO-LINK CREATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IF similarity_score >= 0.75:                                   │
│                                                                  │
│    Task ──REFERENCES──> Pattern  (score: 0.92)                  │
│    Task ──REQUIRES────> Rule     (score: 0.88)                  │
│    Task ──REFERENCES──> Template (score: 0.79)                  │
│    Task ──REFERENCES──> Episode  (score: 0.85)                  │
│                                                                  │
│  Task ──PART_OF──────> Topic     (domain match)                 │
│  Task ──BELONGS_TO───> Project   (explicit)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   4. WORK EXECUTION                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   5. LEARNING CAPTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  On complete_task(learnings="..."):                             │
│                                                                  │
│    1. Create Episode from task                                  │
│    2. Episode ──DERIVED_FROM──> Task                            │
│    3. Inherit relationships:                                    │
│       Episode ──REFERENCES──> Pattern  (inherited)              │
│       Episode ──REFERENCES──> Rule     (inherited)              │
│    4. Extract error patterns from blockers                      │
│    5. Update project progress                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   6. FUTURE TASK ESTIMATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  For new similar task:                                          │
│                                                                  │
│    1. Find similar completed tasks (embedding search)           │
│    2. Extract actual_hours from each                            │
│    3. Calculate weighted average:                               │
│       estimate = Σ(hours[i] * similarity[i]) / Σ(similarity[i])│
│    4. Confidence = f(sample_count, avg_similarity)              │
│                                                                  │
│  Result: "Estimated 6.2 hours (85% confidence)"                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Smart Features Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART TASK FEATURES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. AUTO-SUGGEST KNOWLEDGE                                 │ │
│  │  ───────────────────────────────────────────────────────── │ │
│  │  Input: task_title, description, technologies              │ │
│  │  Process:                                                   │ │
│  │    • Embed query                                            │ │
│  │    • Search patterns (limit: 5)                             │ │
│  │    • Search rules (limit: 5)                                │ │
│  │    • Search templates (limit: 3)                            │ │
│  │    • Search episodes (limit: 5)                             │ │
│  │  Output: {patterns: [], rules: [], templates: [], ...}     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  2. FIND SIMILAR TASKS                                     │ │
│  │  ───────────────────────────────────────────────────────── │ │
│  │  Input: task, status_filter, limit                         │ │
│  │  Process:                                                   │ │
│  │    • Build query from task.title + task.description        │ │
│  │    • Semantic search in Task entities                      │ │
│  │    • Filter by status (e.g., only DONE)                    │ │
│  │    • Exclude self                                           │ │
│  │  Output: [(task, similarity_score), ...]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3. DEPENDENCY DETECTION                                   │ │
│  │  ───────────────────────────────────────────────────────── │ │
│  │  Input: task_id                                             │ │
│  │  Process:                                                   │ │
│  │    • Graph query: (task)-[:DEPENDS_ON]->(deps)             │ │
│  │    • Check for cycles: (t1)-[:DEPENDS_ON*]->(t1)           │ │
│  │    • Topological sort for ordering                         │ │
│  │  Output: dependency_graph, blocking_tasks, suggested_order │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  4. EFFORT ESTIMATION                                      │ │
│  │  ───────────────────────────────────────────────────────── │ │
│  │  Input: task                                                │ │
│  │  Process:                                                   │ │
│  │    • Find similar completed tasks                          │ │
│  │    • Extract actual_hours from each                        │ │
│  │    • Weighted avg: Σ(hours * similarity) / Σ(similarity)   │ │
│  │    • Confidence: f(sample_count, avg_similarity)           │ │
│  │  Output: {hours: 6.2, confidence: 0.85, basis: [...]}      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  5. LEARNING CAPTURE                                       │ │
│  │  ───────────────────────────────────────────────────────── │ │
│  │  Input: completed_task, learnings, blockers                │ │
│  │  Process:                                                   │ │
│  │    • Create Episode entity                                 │ │
│  │    • Format structured content (markdown)                  │ │
│  │    • Link Episode ──DERIVED_FROM──> Task                   │ │
│  │    • Inherit knowledge relationships                       │ │
│  │    • Extract ErrorPattern entities from blockers           │ │
│  │    • Update estimation model with actual_hours             │ │
│  │  Output: episode_id, error_pattern_ids[]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Task Creation to Completion

```
┌──────────┐
│ Developer│
└────┬─────┘
     │
     │ create_task_with_knowledge_links()
     │
     ▼
┌─────────────────────────────────────────┐
│ TaskManager.create_task_with_...()      │
├─────────────────────────────────────────┤
│ 1. entity_manager.create(task)          │ ──┐
│ 2. Embed task content                   │   │
│ 3. Search for related knowledge         │   │
│ 4. Create auto-links (score >= 0.75)    │   │
│ 5. Link to project/topic                │   │
└────────────────┬────────────────────────┘   │
                 │                             │
                 │ task_id                     │
                 ▼                             │
         ┌───────────────┐                     │
         │  Graph DB     │◄────────────────────┘
         │ ┌───────────┐ │
         │ │ Task Node │ │
         │ └───────────┘ │
         │  ↓ ↓ ↓ ↓      │
         │ [Edges to     │
         │  Knowledge]   │
         └───────────────┘
                 │
                 │ workflow_engine.start_task()
                 ▼
         ┌───────────────┐
         │ Update status │
         │ status: doing │
         │ started_at: T │
         │ branch: f/... │
         └───────┬───────┘
                 │
                 │ (developer works)
                 │
                 │ workflow_engine.block_task()
                 ▼
         ┌───────────────┐
         │ status:blocked│
         │ blockers: [...│
         └───────┬───────┘
                 │
                 │ (blocker resolved)
                 │
                 │ workflow_engine.unblock_task()
                 ▼
         ┌───────────────┐
         │ status: doing │
         └───────┬───────┘
                 │
                 │ workflow_engine.submit_for_review()
                 ▼
         ┌───────────────┐
         │ status: review│
         │ commits: [...]│
         │ pr_url: ...   │
         └───────┬───────┘
                 │
                 │ (review approved)
                 │
                 │ workflow_engine.complete_task(learnings="...")
                 ▼
┌──────────────────────────────────────────────────┐
│ WorkflowEngine.complete_task()                   │
├──────────────────────────────────────────────────┤
│ 1. Update task: status=done, completed_at=now   │
│ 2. Create Episode from task + learnings         │ ──┐
│ 3. Link Episode ──DERIVED_FROM──> Task          │   │
│ 4. Inherit relationships to Episode             │   │
│ 5. Update project progress                      │   │
└────────────────┬─────────────────────────────────┘   │
                 │                                      │
                 ▼                                      │
         ┌───────────────┐                              │
         │  Graph DB     │◄─────────────────────────────┘
         │ ┌───────────┐ │
         │ │ Task:done │ │
         │ └───────────┘ │
         │       ↑       │
         │       │       │
         │   DERIVED_    │
         │     FROM      │
         │       │       │
         │ ┌───────────┐ │
         │ │  Episode  │ │
         │ └───────────┘ │
         │  ↓ ↓ ↓        │
         │ [Same edges   │
         │  as Task]     │
         └───────────────┘
                 │
                 │ Future task creation
                 ▼
         ┌───────────────┐
         │ Estimation    │
         │ uses Episode  │
         │ actual_hours  │
         └───────────────┘
```

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                         Python Modules                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  sibyl/                                                          │
│  ├── models/                                                     │
│  │   ├── entities.py         (base Entity, RelationshipType)    │
│  │   └── tasks.py            (Task, Project, Team, etc.)        │
│  │                                                               │
│  ├── graph/                                                      │
│  │   ├── client.py           (GraphClient wrapper)              │
│  │   ├── entities.py         (EntityManager - CRUD)             │
│  │   └── relationships.py    (RelationshipManager)              │
│  │                                                               │
│  ├── tasks/                                                      │
│  │   ├── __init__.py                                             │
│  │   ├── manager.py          (TaskManager - intelligence)       │
│  │   └── workflow.py         (TaskWorkflowEngine - lifecycle)   │
│  │                                                               │
│  └── tools/                  (MCP tool implementations)         │
│      └── tasks.py            (create_task, complete_task, etc.) │
│                                                                  │
│  Dependency Flow:                                                │
│  ─────────────────                                               │
│  tools.tasks → tasks.manager → graph.entities → graph.client    │
│             ↘  tasks.workflow → graph.relationships             │
│               ↘ models.tasks → models.entities                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Claude Code  │  │   Web UI     │  │     CLI      │          │
│  │  (MCP Tools) │  │  (GraphQL)   │  │   (Python)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          └────────┬────────┴────────┬────────┘
                   │                 │
┌──────────────────┼─────────────────┼───────────────────────────┐
│              Application Server                                 │
├──────────────────┼─────────────────┼───────────────────────────┤
│                  │                 │                            │
│  ┌───────────────▼─────────────────▼──────────────┐            │
│  │          FastAPI / MCP Server                   │            │
│  │  ┌───────────────────────────────────────────┐  │            │
│  │  │  MCP Tools (create_task, etc.)            │  │            │
│  │  └───────────────┬───────────────────────────┘  │            │
│  │                  │                               │            │
│  │  ┌───────────────▼───────────────────────────┐  │            │
│  │  │  TaskManager + WorkflowEngine             │  │            │
│  │  └───────────────┬───────────────────────────┘  │            │
│  │                  │                               │            │
│  │  ┌───────────────▼───────────────────────────┐  │            │
│  │  │  EntityManager + RelationshipManager      │  │            │
│  │  └───────────────┬───────────────────────────┘  │            │
│  └──────────────────┼───────────────────────────────┘            │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
┌─────────────────────┼────────────────────────────────────────────┐
│                 Graph Database                                   │
├─────────────────────┼────────────────────────────────────────────┤
│                     │                                            │
│  ┌──────────────────▼──────────────────┐                        │
│  │      Graphiti Framework              │                        │
│  │  ┌────────────────────────────────┐  │                        │
│  │  │  Entity Nodes (w/ embeddings)  │  │                        │
│  │  │  Relationship Edges (typed)    │  │                        │
│  │  │  Episode Storage               │  │                        │
│  │  └────────────────┬───────────────┘  │                        │
│  └───────────────────┼───────────────────┘                        │
│                      │                                           │
│  ┌───────────────────▼───────────────┐                          │
│  │         FalkorDB                   │                          │
│  │  ┌──────────────────────────────┐  │                          │
│  │  │  Graph Storage (Cypher)      │  │                          │
│  │  │  Vector Indices (RediSearch) │  │                          │
│  │  │  In-Memory Performance       │  │                          │
│  │  └──────────────────────────────┘  │                          │
│  └─────────────────────────────────────┘                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     External Integrations                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   Git    │  │  CI/CD   │  │  Slack   │  │  Jira    │         │
│  │ (commits)│  │(webhooks)│  │(notifs)  │  │  (sync)  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │              │             │               │
│       └─────────────┴──────────────┴─────────────┘               │
│                            │                                      │
│                  ┌─────────▼──────────┐                          │
│                  │  Webhook Handler   │                          │
│                  └────────────────────┘                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Legend

```
┌─────┐
│ Box │  = Component or Layer
└─────┘

  │
  ▼      = Data/Control Flow

 ───     = Relationship/Edge

[Node]   = Graph Entity

(action) = Function/Method Call
```
