---
name: sibyl-knowledge
description: Graph-RAG knowledge oracle with CLI interface. Use `sibyl` for semantic search, task management, knowledge capture, and graph exploration. Invoke when you need persistent memory across sessions, pattern/learning lookup, or task tracking. Requires FalkorDB running.
allowed-tools: Bash
---

# Sibyl Knowledge Oracle

Sibyl gives you persistent memory across coding sessions. Search patterns, track tasks, capture learnings—all stored in a knowledge graph.

## Quick Start

```bash
# Link your directory to a project (one-time setup)
sibyl project link              # Interactive picker
sibyl project link project_abc  # Or specify ID directly

# Check current context
sibyl context

# Now task commands auto-scope to your project!
sibyl task list --status todo   # Only shows tasks for linked project

# Search for knowledge
sibyl search "authentication patterns"

# Quickly add a learning
sibyl add "Redis insight" "Connection pool must be >= concurrent requests"

# Start a task
sibyl task start task_xyz

# Complete with learnings
sibyl task complete task_xyz --learnings "OAuth tokens expire..."
```

**Pro tips:**
- **Link your project first** - then task commands just work without `--project`
- **Always use JSON output** (default) - it's structured and jq-parseable
- Use `--all` flag to bypass context and see all projects
- Use `2>&1` when piping to capture all output (spinner goes to stderr)

---

## The Agent Feedback Loop

```
1. SEARCH FIRST     → sibyl search "topic"
2. CHECK TASKS      → sibyl task list --status doing
3. WORK & CAPTURE   → sibyl entity create (for learnings)
4. COMPLETE         → sibyl task complete --learnings "..."
```

---

## Core Commands

### Search - Find Knowledge by Meaning

```bash
# Semantic search across all types
sibyl search "error handling patterns"

# Filter by entity type
sibyl search "OAuth" --type pattern

# Limit results
sibyl search "debugging redis" --limit 5
```

**When to use:** Before implementing anything. Find existing patterns, past solutions, gotchas.

---

### Add - Quick Knowledge Capture

```bash
# Basic: title and content
sibyl add "Title" "What you learned..."

# With metadata
sibyl add "OAuth insight" "Token refresh timing..." -c authentication -l python

# Auto-link to related entities
sibyl add "Redis pattern" "Connection pooling..." --auto-link

# Create a pattern instead of episode
sibyl add "Retry pattern" "Exponential backoff..." --type pattern
```

**When to use:** After discovering something non-obvious. Quick way to capture learnings.

---

### Task Management - Full Lifecycle

```bash
# CREATE a task (requires project)
sibyl task create --title "Implement OAuth" --project proj_abc
sibyl task create -t "Add rate limiting" -p proj_api --priority high
sibyl task create -t "Fix bug" -p proj_web --assignee alice --tech python,redis
```

```bash
# List tasks (ALWAYS filter by project or status)
sibyl task list --project proj_abc
sibyl task list --status todo
sibyl task list --status doing
sibyl task list --assignee alice

# Show task details
sibyl task show task_xyz

# Start working (generates branch name)
sibyl task start task_xyz --assignee alice

# Block with reason
sibyl task block task_xyz --reason "Waiting on API keys"

# Resume blocked task
sibyl task unblock task_xyz

# Submit for review
sibyl task review task_xyz --pr "github.com/.../pull/42"

# Complete with learnings (IMPORTANT: capture what you learned!)
sibyl task complete task_xyz --hours 4.5 --learnings "Token refresh needs..."

# Archive
sibyl task archive task_xyz --yes

# Direct update (bulk/historical updates)
sibyl task update task_xyz --status done --priority high
sibyl task update task_xyz -s todo -p medium
```

**Task States:** `backlog ↔ todo ↔ doing ↔ blocked ↔ review ↔ done ↔ archived`

(Any transition is allowed for flexibility with historical/bulk data)

---

### Project Management

```bash
# List all projects
sibyl project list

# Show project details
sibyl project show proj_abc

# Create a project
sibyl project create --name "Auth System" --description "OAuth and JWT implementation"
```

---

### Project Context (Directory Linking)

Link directories to projects for automatic task scoping. Once linked, you don't need `--project` flags.

```bash
# Link current directory to a project
sibyl project link                    # Interactive - pick from list
sibyl project link project_abc123     # Link to specific project
sibyl project link proj_x --path ~/dev/other  # Link a different path

# Check current context
sibyl context                         # JSON output
sibyl context -t                      # Human-readable

# List all directory-to-project links
sibyl project links

# Remove a link
sibyl project unlink                  # Unlink current directory
sibyl project unlink --path ~/old/project
```

**How it works:**
- Mappings stored in `~/.sibyl/config.toml` under `[paths]`
- Uses longest-prefix matching (so `~/dev/sibyl/web` matches `~/dev/sibyl`)
- Task commands auto-resolve project from cwd
- Use `--all` flag to bypass context: `sibyl task list --all`

---

### Entity Operations - Generic CRUD

```bash
# List entities by type
sibyl entity list --type pattern
sibyl entity list --type episode
sibyl entity list --type rule --language python

# Show entity details
sibyl entity show entity_xyz

# Create an entity (for capturing learnings)
sibyl entity create --type episode --name "Redis insight" --content "Discovered that..."

# Find related entities
sibyl entity related entity_xyz

# Delete (with confirmation)
sibyl entity delete entity_xyz
```

**Entity Types:** pattern, rule, template, tool, topic, episode, task, project, source, document

---

### Graph Exploration

```bash
# Find related entities (1-hop)
sibyl explore related entity_xyz

# Multi-hop traversal
sibyl explore traverse entity_xyz --depth 2

# Task dependency chain
sibyl explore dependencies task_xyz

# Find path between entities
sibyl explore path from_id to_id
```

---

### Admin & Health

```bash
# Check system health
sibyl health

# Show statistics
sibyl stats

# Show config
sibyl config
```

---

## Common Workflows

### First-Time Setup (per project)

```bash
# Link your project directory (one-time)
cd ~/dev/my-project
sibyl project link

# Verify
sibyl context -t
```

### Starting a New Session

```bash
# 1. Check current context (should show your project)
sibyl context

# 2. Check for in-progress work
sibyl task list --status doing

# 3. Or find todo tasks (auto-scoped to project)
sibyl task list --status todo

# 4. Start working
sibyl task start task_xyz
```

### Research Before Implementation

```bash
# Find patterns
sibyl search "what you're implementing" --type pattern

# Find past learnings
sibyl search "related topic" --type episode

# Check for gotchas
sibyl search "common mistakes" --type episode
```

### Capture a Learning

```bash
# Quick capture
sibyl add "Descriptive title" "What you learned and why it matters"

# With metadata
sibyl add "Descriptive title" "What you learned..." -c debugging -l python --auto-link
```

### Complete Task with Learnings

```bash
# Capture insights when completing
sibyl task complete task_xyz \
  --hours 4.5 \
  --learnings "Key insight: The OAuth flow requires..."
```

---

## Output Formats

**Always use JSON output** (the default). Parse with `jq`.

### Extracting Data with jq

```bash
# Extract just task names
sibyl task list --status todo 2>&1 | jq -r '.[].name'

# Count tasks by status
sibyl task list --status todo 2>&1 | jq 'length'

# Get names and priorities
sibyl task list --status todo 2>&1 | jq -r '.[] | "\(.metadata.priority)\t\(.name)"'

# Filter by priority
sibyl task list --status todo 2>&1 | jq -r '.[] | select(.metadata.priority == "high") | .name'

# Get tasks grouped by feature
sibyl task list --status todo 2>&1 | jq -r 'group_by(.metadata.feature) | .[] | "\(.[0].metadata.feature // "none"):\n\(.[].name | "  - \(.)")"'

# Sorted by priority (critical first)
sibyl task list --status todo 2>&1 | jq -r 'sort_by(.metadata.priority) | .[].name'
```

### JSON Output Notes

- **Clean output**: Embeddings are automatically stripped from CLI output
- **Valid JSON**: Output is properly escaped and jq-parseable

### CSV Export (Alternative)

```bash
sibyl task list --csv
sibyl entity list --type pattern --csv
```

---

## Key Principles

1. **Search Before Implementing** - Always check for existing knowledge
2. **Project-First for Tasks** - Filter tasks by project, not globally
3. **Capture Non-Obvious Learnings** - If it took time to figure out, save it
4. **Complete with Learnings** - Always capture insights when finishing tasks
5. **Use Entity Types Properly**:
   - `episode` - Temporal insights, debugging discoveries
   - `pattern` - Reusable coding patterns
   - `rule` - Hard constraints, must-follow rules
   - `task` - Work items with lifecycle

---

## CLI vs MCP Tools

**Prefer CLI over MCP tools** (`mcp__sibyl__*`):

| Aspect | CLI (`sibyl`) | MCP Tools |
|--------|---------------------|-----------|
| Reliability | Always works | May have session issues |
| Output control | `--table`, `--csv`, JSON | JSON only |
| Bulk operations | Pipes, grep, scripts | One call at a time |
| Status filtering | `--status`, `--project` | Parameters in JSON |

The MCP tools (`mcp__sibyl__search`, `mcp__sibyl__add`, etc.) are available but may return session errors if the server isn't running. **CLI is the reliable path.**

---

## Troubleshooting

### "No valid session ID" from MCP tools
The Sibyl MCP server isn't running. Use CLI instead:
```bash
sibyl search "query"  # Instead of mcp__sibyl__search
```

### FalkorDB connection errors
```bash
# Check if FalkorDB is running
docker ps | grep falkordb

# Start it
docker compose up -d

# Verify
sibyl health
```

### Task list shows wrong project's tasks
Check your project context:
```bash
sibyl context                      # See which project you're linked to
sibyl project link                 # Link to correct project
sibyl task list --all              # Bypass context to see all
```

### Task list shows old/test data
Filter by status to focus:
```bash
sibyl task list --status todo      # Active work only
```

---

## Task Reporting Recipes

### Get task counts by status
```bash
echo "TODO: $(sibyl task list --status todo 2>&1 | jq 'length')"
echo "DOING: $(sibyl task list --status doing 2>&1 | jq 'length')"
echo "DONE: $(sibyl task list --status done 2>&1 | jq 'length')"
```

### List task names by status
```bash
sibyl task list --status todo 2>&1 | jq -r '.[].name'
```

### List tasks with priority and feature (sorted)
```bash
# Priority + feature + name, sorted
sibyl task list --status todo 2>&1 | jq -r '.[] | "\(.metadata.priority)\t\(.metadata.feature // "-")\t\(.name)"' | sort
```

### Filter by priority
```bash
# Only critical/high priority
sibyl task list --status todo 2>&1 | jq -r '.[] | select(.metadata.priority == "critical" or .metadata.priority == "high") | .name'
```

### Group by feature
```bash
sibyl task list --status todo 2>&1 | jq -r 'group_by(.metadata.feature) | .[] | "\(.[0].metadata.feature // "other"):", (.[].name | "  - \(.)")'
```

### Export for external tools
```bash
# CSV export for spreadsheets
sibyl task list --status todo --csv > tasks.csv
```

---

## Prerequisites

```bash
# Ensure FalkorDB is running
docker compose up -d

# Check health
sibyl health

# If fresh install, run setup
sibyl setup
```
