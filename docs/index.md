---
layout: home

hero:
  name: Sibyl
  text: Collective Intelligence Runtime
  tagline: Give your AI agents persistent memory, semantic search, and collaborative knowledge
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/hyperb1iss/sibyl

features:
  - icon: 🧠
    title: Persistent Memory
    details: Knowledge that survives across sessions. Your agents remember patterns, learnings, and context.
  - icon: 🔍
    title: Semantic Search
    details: Find knowledge by meaning, not keywords. Graph-powered RAG with Graphiti and FalkorDB.
  - icon: 📋
    title: Task Orchestration
    details: Track work across agents and sessions. Full lifecycle from backlog to completion with learnings capture.
  - icon: 🤝
    title: Multi-Agent Collaboration
    details: Shared knowledge graph enables agents to learn from each other and build collective intelligence.
  - icon: 🔌
    title: MCP Native
    details: Four powerful tools - search, explore, add, manage - designed for Model Context Protocol.
  - icon: 🚀
    title: Production Ready
    details: Multi-tenant, org-scoped, with Kubernetes deployment via Helm. Built for real workloads.
---

## Quick Start

```bash
# Install the CLI
pip install sibyl-cli

# Or with uv
uv tool install sibyl-cli

# Start the server (requires FalkorDB)
sibyld serve

# Search your knowledge
sibyl search "authentication patterns"

# Add a learning
sibyl add "Redis insight" "Connection pool must be >= concurrent requests"

# Manage tasks
sibyl task list --status doing
sibyl task complete task_xyz --learnings "OAuth tokens expire after 1 hour"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Agents (Claude, etc.)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ MCP Protocol
┌──────────────────────────▼──────────────────────────────────┐
│                      Sibyl Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  MCP Tools  │  │  REST API   │  │   Background Jobs   │ │
│  │ search/add  │  │  /entities  │  │  (arq + Redis)      │ │
│  │ explore/    │  │  /tasks     │  │                     │ │
│  │ manage      │  │  /projects  │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    sibyl-core Library                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Models    │  │   Graph     │  │      Graphiti       │ │
│  │  Task, etc. │  │   Client    │  │   Knowledge Graph   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Data Stores                            │
│  ┌─────────────────────┐  ┌───────────────────────────────┐│
│  │     PostgreSQL      │  │          FalkorDB             ││
│  │   (Users, Orgs)     │  │    (Knowledge Graph)          ││
│  └─────────────────────┘  └───────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Why Sibyl?

AI agents are powerful but forgetful. Every session starts fresh, losing all the patterns, gotchas, and learnings from previous work. Sibyl solves this by providing:

- **Persistent Knowledge Graph**: Entities, relationships, and episodes stored in FalkorDB
- **Semantic Search**: Find relevant knowledge by meaning using embeddings
- **Task Management**: Track work with full lifecycle and learnings capture
- **Multi-Tenancy**: Isolated graphs per organization for secure collaboration
- **MCP Integration**: Native support for the Model Context Protocol

Whether you're building with Claude Code, custom agents, or multi-agent systems, Sibyl gives your AI the memory it deserves.
