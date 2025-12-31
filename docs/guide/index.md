---
title: Introduction to Sibyl
description: Collective Intelligence Runtime for AI Agents
---

# Introduction to Sibyl

Sibyl is a **Collective Intelligence Runtime** - a system that provides AI agents with persistent memory, semantic search, task orchestration, and collaborative knowledge through a graph-based knowledge store.

## What is Sibyl?

At its core, Sibyl transforms scattered development knowledge into a queryable graph. Patterns, learnings, tasks, documentation - all connected, all searchable by meaning rather than keywords.

Think of Sibyl as an extended memory system for AI agents that:

- **Persists across sessions** - What you learn today helps tomorrow
- **Connects knowledge** - New information automatically links to related entities
- **Supports multiple agents** - Shared memory enables collaboration
- **Tracks work** - Full task lifecycle with status, blockers, and learnings

## Key Features

### Semantic Search

Find knowledge by meaning, not just keywords. Sibyl uses vector embeddings and hybrid search (semantic + BM25) to surface relevant information.

```bash
sibyl search "authentication patterns"
sibyl search "OAuth implementation" --type pattern
```

### Persistent Memory

Knowledge captured in Sibyl persists across coding sessions. When you discover something non-obvious, save it:

```bash
sibyl add "Redis connection pooling" "Pool size must be >= concurrent requests to avoid blocking"
```

### Task Orchestration

Full workflow management with states, priorities, dependencies, and learning capture:

```
backlog -> todo -> doing -> blocked -> review -> done -> archived
```

### Knowledge Graph

Entities are connected through typed relationships, enabling graph traversal and discovery of related knowledge.

### Multi-Tenancy

Each organization gets its own isolated FalkorDB graph, ensuring data separation and security.

### Auto-Linking

When you add new knowledge, Sibyl automatically discovers and links related entities based on semantic similarity.

## Use Cases

### Claude Code Integration

Sibyl is designed as an MCP (Model Context Protocol) server that integrates directly with Claude Code. Agents can:

- Search for patterns before implementing
- Track work through tasks
- Capture learnings automatically
- Access shared organizational knowledge

```json
{
  "mcpServers": {
    "sibyl": {
      "type": "http",
      "url": "http://localhost:3334/mcp"
    }
  }
}
```

### Multi-Agent Systems

Multiple AI agents can share the same knowledge graph:

- Agent A discovers a bug pattern and captures it
- Agent B searches and finds that pattern when encountering similar issues
- Both agents contribute to a growing body of organizational knowledge

### Development Knowledge Management

Teams can use Sibyl to:

- Document architectural decisions
- Capture debugging insights
- Track project tasks and progress
- Build a searchable knowledge base from daily work

## Architecture Overview

Sibyl consists of several components:

| Component | Purpose |
|-----------|---------|
| **API Server** (`sibyld`) | FastAPI + MCP server handling requests |
| **CLI** (`sibyl`) | Command-line interface for human and agent interaction |
| **Web UI** | Next.js frontend for visual exploration |
| **FalkorDB** | Graph database storing entities and relationships |
| **PostgreSQL** | Relational storage for users, sessions, crawled documents |
| **Worker** | Background job processing (arq) for async operations |

```
Sibyl Combined App (Starlette, port 3334)
├── /api/*    -> FastAPI REST endpoints
├── /mcp      -> MCP streamable-http (4 tools)
├── /ws       -> WebSocket for real-time updates
└── Lifespan  -> Background queue + session management
```

## The 4-Tool API

Sibyl exposes exactly 4 MCP tools. Simple surface, rich capabilities:

| Tool | Purpose | Examples |
|------|---------|----------|
| `search` | Find by meaning | Patterns, tasks, docs, errors |
| `explore` | Navigate structure | List entities, traverse relationships |
| `add` | Create knowledge | Episodes, patterns, tasks |
| `manage` | Lifecycle & admin | Task workflow, crawling, health |

## Philosophy

### Search Before Implementing

The graph knows things. Before you code:

```bash
sibyl search "what you're building"
sibyl search "error you hit" --type episode
```

### Work In Task Context

Never do significant work outside a task. Tasks provide traceability, progress tracking, and knowledge linking.

### Capture What You Learn

If it took time to figure out, save it:

```bash
sibyl add "Descriptive title" "What, why, how, caveats"
```

**Bad:** "Fixed the bug"

**Good:** "JWT refresh fails when Redis TTL expires. Root cause: token service doesn't handle WRONGTYPE. Fix: try/except with regeneration fallback."

### Complete With Learnings

```bash
sibyl task complete <id> --learnings "Key insight: ..."
```

The graph should be smarter after every session.

## Next Steps

- [Installation](./installation.md) - Get Sibyl running locally
- [Quick Start](./quick-start.md) - 5-minute tutorial
- [Knowledge Graph](./knowledge-graph.md) - Understand the architecture
- [Claude Code Integration](./claude-code.md) - Configure MCP integration
