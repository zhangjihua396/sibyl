---
title: Agent Harness
description: Autonomous agent orchestration with Sibyl
---

# Agent Harness

The Agent Harness is Sibyl's system for spawning and managing autonomous Claude agents. It provides
isolated execution environments, approval workflows, checkpoint/resume capabilities, and real-time
monitoring through the web UI.

::: warning Beta Feature The Agent Harness is under active development. APIs may change. :::

## Overview

The harness enables you to:

- **Spawn autonomous agents** that work on tasks independently
- **Isolate work** in git worktrees to prevent conflicts
- **Request approvals** for sensitive operations
- **Checkpoint and resume** sessions across interruptions
- **Monitor progress** via WebSocket-connected UI

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Harness                                              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Agent 1    │  │  Agent 2    │  │  Agent 3    │         │
│  │  (OAuth)    │  │  (UI fix)   │  │  (Tests)    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Shared Knowledge Graph                              │   │
│  │  (Tasks, Patterns, Learnings, Progress)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

### Core Components

| Component           | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `AgentRunner`       | Spawns and manages agent instances             |
| `Orchestrator`      | Coordinates multiple agents, health monitoring |
| `ApprovalService`   | Handles human-in-the-loop approvals            |
| `CheckpointManager` | Persists and restores session state            |
| `WorktreeManager`   | Creates isolated git worktrees                 |
| `StatusReporter`    | Sends real-time updates via WebSocket          |

### Agent Lifecycle

```
                    ┌──────────┐
                    │ SPAWNED  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────│ WORKING  │─────┐
              │     └────┬─────┘     │
              │          │           │
     ┌────────▼────┐     │    ┌──────▼──────┐
     │ WAITING_    │     │    │ PAUSED      │
     │ APPROVAL    │     │    │ (checkpnt)  │
     └────────┬────┘     │    └──────┬──────┘
              │          │           │
              └────┬─────┘───────────┘
                   │
              ┌────▼─────┐
              │ COMPLETED│
              │ or FAILED│
              └──────────┘
```

## Spawning Agents

### Via Web UI

1. Navigate to a task in the web UI
2. Click "Spawn Agent"
3. The agent starts working autonomously
4. Monitor progress in the Agent Chat panel

### Via API

```python
from sibyl.agents import AgentRunner

runner = AgentRunner(entity_manager, lock_manager, claude_client)

agent = await runner.spawn(
    task_id="task_abc123",
    model="claude-sonnet-4-20250514",
    system_prompt="You are a focused developer...",
    worktree_path="/path/to/isolated/worktree"
)
```

### Via CLI (Coming Soon)

```bash
sibyl agent spawn --task task_abc123 --model sonnet
```

## Git Worktree Isolation

Each agent works in an isolated git worktree to prevent conflicts:

```
project/
├── main/                 # Main working tree
├── .worktrees/
│   ├── agent_abc123/     # Agent 1's isolated environment
│   └── agent_def456/     # Agent 2's isolated environment
```

### Benefits

- **No conflicts**: Agents can't overwrite each other's work
- **Clean merges**: Each agent's changes are on a separate branch
- **Easy cleanup**: Delete worktree when done
- **Parallel work**: Multiple agents work simultaneously

### Worktree Lifecycle

```python
from sibyl.agents import WorktreeManager

wm = WorktreeManager(repo_path="/path/to/repo")

# Create worktree for agent
worktree = await wm.create_worktree(
    agent_id="agent_abc123",
    base_branch="main",
    worktree_name="feature/oauth-fix"
)

# Agent works in worktree.path...

# Cleanup when done
await wm.cleanup_worktree(agent_id="agent_abc123")
```

## Approval System

Some operations require human approval before execution:

### Approval Types

| Type           | Trigger                          |
| -------------- | -------------------------------- |
| `BASH`         | Shell commands (destructive ops) |
| `EDIT`         | File modifications               |
| `WRITE`        | New file creation                |
| `MCP_TOOL`     | MCP tool invocations             |
| `GIT`          | Git operations (commit, push)    |
| `EXTERNAL_API` | External API calls               |

### How It Works

1. Agent attempts a sensitive operation
2. Hook intercepts and creates approval request
3. Request appears in web UI
4. Human approves or denies
5. Agent continues or aborts

### Approval UI

In the agent chat panel, approval requests appear inline:

```
┌─────────────────────────────────────────────────────────────┐
│  🔒 Approval Required                                       │
│                                                             │
│  Type: BASH                                                 │
│  Command: rm -rf node_modules && npm install                │
│                                                             │
│  [Approve]  [Deny]                                          │
└─────────────────────────────────────────────────────────────┘
```

### Configuring Approvals

Approval requirements are configured via hooks:

```python
from sibyl.agents.hooks import PreToolUse

async def require_approval_for_bash(tool_name: str, tool_input: dict):
    if tool_name == "Bash":
        command = tool_input.get("command", "")
        if any(dangerous in command for dangerous in ["rm -rf", "DROP", "DELETE"]):
            return ApprovalRequired(
                type=ApprovalType.BASH,
                summary=f"Destructive command: {command[:50]}...",
                command=command
            )
    return None  # No approval needed
```

## Checkpoints and Resume

Agents can be paused and resumed across sessions:

### Creating Checkpoints

```python
# Agent creates checkpoint before long operation
await agent.checkpoint(
    step_description="About to run integration tests",
    notes="OAuth implementation complete, running validation"
)
```

### Automatic Checkpointing

The harness automatically checkpoints:

- Before tool execution
- After significant progress
- On session end

### Resuming from Checkpoint

```python
# Find latest checkpoint for agent
checkpoint = await checkpoint_manager.get_latest(agent_id="agent_abc123")

# Resume from checkpoint
agent = await runner.resume_from_checkpoint(checkpoint)
```

### What Gets Checkpointed

| Data                 | Stored                              |
| -------------------- | ----------------------------------- |
| Conversation history | Full message log                    |
| Git state            | Modified files, uncommitted changes |
| Current step         | Description of work in progress     |
| Task context         | Task ID, status, notes              |
| Custom metadata      | Agent-specific state                |

## User Questions

Agents can ask users questions during execution:

```
┌─────────────────────────────────────────────────────────────┐
│  ❓ Agent Question                                          │
│                                                             │
│  Which authentication provider should I use?                │
│                                                             │
│  ○ OAuth with Google (Recommended)                          │
│  ○ SAML with Okta                                           │
│  ○ Custom JWT implementation                                │
│  ○ Other: _____________                                     │
│                                                             │
│  [Submit Answer]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Triggering Questions

Agents use the `AskUserQuestion` tool:

```python
# In agent execution
response = await ask_user_question(
    question="Which authentication provider should I use?",
    options=[
        {"label": "OAuth with Google (Recommended)", "description": "Standard OAuth2 flow"},
        {"label": "SAML with Okta", "description": "Enterprise SSO"},
        {"label": "Custom JWT", "description": "Roll your own"},
    ]
)
```

## Monitoring Agents

### Web UI Dashboard

The agent dashboard shows:

- **Active agents**: Currently running agents
- **Agent status**: Working, waiting, paused, completed
- **Progress**: Current task step and notes
- **Chat history**: Full conversation with tool calls

### WebSocket Updates

Real-time updates via WebSocket:

```typescript
const ws = new WebSocket("/api/agents/ws");

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);

  switch (update.type) {
    case "status_change":
      // Agent status changed
      break;
    case "message":
      // New chat message
      break;
    case "approval_request":
      // Needs human approval
      break;
    case "question":
      // Agent asking a question
      break;
  }
};
```

### CLI Monitoring (Coming Soon)

```bash
# List active agents
sibyl agent list

# Watch agent output
sibyl agent watch agent_abc123

# Get agent status
sibyl agent status agent_abc123
```

## Task Integration

Agents work within the task system:

### Starting Work

When an agent is spawned for a task:

1. Task status changes to `doing`
2. Agent is assigned to task (`assigned_agent` field)
3. Agent starts with task context

### Progress Updates

Agents update task notes as they work:

```python
await entity_manager.update_task(
    task_id="task_abc123",
    notes="Implemented OAuth callback handler. Testing next."
)
```

### Completion

When an agent completes:

1. Task status changes to `review` or `done`
2. Learnings are captured
3. Worktree can be cleaned up or kept for review

## Best Practices

### 1. Use Worktree Isolation

Always run agents in isolated worktrees for parallel work:

```python
agent = await runner.spawn(
    task_id="task_abc",
    worktree_path=await wm.create_worktree(agent_id, "main")
)
```

### 2. Configure Appropriate Approvals

Balance autonomy with safety:

- **Allow**: Read operations, safe writes
- **Require approval**: Destructive ops, external APIs, git push

### 3. Checkpoint Frequently

Enable session resilience:

```python
# After each significant step
await agent.checkpoint(step_description="Completed OAuth handler")
```

### 4. Monitor Active Agents

Use the web UI to:

- Watch progress in real-time
- Respond to approval requests quickly
- Intervene if agent gets stuck

### 5. Capture Learnings

Ensure agents complete tasks with learnings:

```python
await entity_manager.complete_task(
    task_id="task_abc",
    learnings="OAuth requires exact redirect URI matching..."
)
```

## Troubleshooting

### Agent Stuck Waiting

1. Check for pending approval requests
2. Check for unanswered questions
3. Review recent messages for errors

### Worktree Conflicts

1. Check worktree status: `git -C /path/to/worktree status`
2. Resolve conflicts manually or reset
3. Resume agent from checkpoint

### Agent Failed

1. Check agent logs in web UI
2. Review last checkpoint
3. Fix issue and resume, or restart fresh

### Approval Timeout

Approvals expire after a configurable timeout:

```python
APPROVAL_TIMEOUT_SECONDS = 300  # 5 minutes default
```

Increase for async workflows where humans may not respond immediately.

## API Reference

### AgentRunner

```python
class AgentRunner:
    async def spawn(
        self,
        task_id: str,
        model: str = "claude-sonnet-4-20250514",
        system_prompt: str | None = None,
        worktree_path: str | None = None,
    ) -> AgentInstance

    async def stop_agent(self, agent_id: str) -> bool

    async def list_active(self) -> list[AgentInstance]
```

### AgentInstance

```python
class AgentInstance:
    agent_id: str
    task_id: str
    status: AgentStatus
    worktree_path: str | None

    async def execute(self) -> None
    async def stop(self) -> None
    async def pause(self) -> None
    async def checkpoint(self, step_description: str) -> None
```

### CheckpointManager

```python
class CheckpointManager:
    async def checkpoint(
        self,
        agent_id: str,
        conversation_history: list[dict],
        current_step: str,
        metadata: dict | None = None,
    ) -> AgentCheckpoint

    async def get_latest(self, agent_id: str) -> AgentCheckpoint | None

    async def list_checkpoints(self, agent_id: str) -> list[AgentCheckpoint]
```

## Next Steps

- [Agent Collaboration](./agent-collaboration.md) - Multi-agent patterns
- [Task Management](./task-management.md) - Task lifecycle
- [Claude Code](./claude-code.md) - MCP integration
