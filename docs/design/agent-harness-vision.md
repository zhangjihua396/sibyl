# Sibyl Agent Harness: Architecture Vision

> **Status:** Design Document **Date:** 2026-01-01 **Author:** Nova + Bliss

---

## Executive Summary

Transform Sibyl from a knowledge graph into a **Collective Intelligence Runtime** — an orchestration
platform where AI agents collaborate through shared memory, parallel execution, and coordinated
development workflows.

**Core Insight:** The Claude Agent SDK provides the primitives (subagents, hooks, tools). Sibyl
provides the coordination layer (task locking, knowledge sharing, progress tracking). Git worktrees
enable true parallel development without conflicts.

---

## 1. Vision: The 1000x Engineer's Toolkit

Imagine describing a feature and watching a fleet of specialized agents:

1. **Planning Agent** breaks it into tasks with dependencies
2. **Spec Agent** generates detailed specifications
3. **Implementation Agents** (2-8) work in parallel worktrees
4. **Testing Agent** writes and runs tests
5. **Review Agent** performs code review
6. **Integration Agent** merges worktrees, resolves conflicts
7. **Documentation Agent** updates docs

All coordinated through Sibyl's knowledge graph, with human oversight at key checkpoints.

### Why This Works Now

| Capability           | Source                 | Status                  |
| -------------------- | ---------------------- | ----------------------- |
| Agent execution      | Claude Agent SDK       | Production-ready        |
| Task coordination    | Sibyl (existing)       | Extend for agents       |
| Parallel development | Git worktrees          | Battle-tested           |
| Knowledge sharing    | Sibyl graph            | Existing                |
| Web UI               | Sibyl web (Next.js 16) | Extend with Agents page |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SIBYL WEB UI                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Tasks   │  │  Graph   │  │ AGENTS   │  │ Settings │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                    ▲                                         │
│                                    │ WebSocket (real-time updates)           │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                           SIBYL API                                          │
│  ┌─────────────────────────────────┼───────────────────────────────────────┐ │
│  │             ORCHESTRATOR        │                                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌────┴────┐  ┌─────────┐  ┌─────────┐       │ │
│  │  │ Planner │  │Scheduler│  │ Monitor │  │ Merger  │  │ Router  │       │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                         │
│  ┌─────────────────────────────────┼───────────────────────────────────────┐ │
│  │      ON-DEMAND AGENT SPAWNING   │                                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌────┴────┐                                  │ │
│  │  │Claude 1 │  │Claude 2 │  │Claude N │  (spawned as needed)             │ │
│  │  │+subagnts│  │+subagnts│  │+subagnts│                                  │ │
│  │  │worktree │  │worktree │  │worktree │                                  │ │
│  │  │  /t001  │  │  /t002  │  │  /t00N  │                                  │ │
│  │  └─────────┘  └─────────┘  └─────────┘                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                         │
│  ┌──────────────────────────────────┼──────────────────────────────────────┐ │
│  │                 HUMAN-IN-THE-LOOP LAYER                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │ │
│  │  │Approval Queue│  │ Review Phase │  │  Chat Bridge │                   │ │
│  │  │  (unified)   │  │  (on request)│  │  (per agent) │                   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                         │
│  ┌──────────────────────────────────┼──────────────────────────────────────┐ │
│  │                    COORDINATION LAYER                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Task Locking │  │  Event Bus   │  │ Checkpoints  │  │  Heartbeats  │ │ │
│  │  │   (Redis)    │  │   (Redis)    │  │   (Redis)    │  │   (Redis)    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                        PERSISTENCE LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                        │
│  │   FalkorDB   │  │    Redis     │  │  Worktrees   │                        │
│  │   (Graph)    │  │   (State)    │  │   (Git)      │                        │
│  └──────────────┘  └──────────────┘  └──────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Claude Agent SDK Integration

### 3.1 Agent Execution Model

Each agent runs as a **separate Claude Agent SDK instance** with:

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async def create_worker_agent(
    task: Task,
    worktree_path: Path,
    sibyl_tools: list
) -> AsyncIterator[Message]:
    """Create a worker agent for a specific task."""

    options = ClaudeAgentOptions(
        # Isolated workspace
        cwd=str(worktree_path),

        # Tools available to agent
        allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob", *sibyl_tools],

        # MCP servers (Sibyl for knowledge, custom for project)
        mcp_servers={
            "sibyl": create_sibyl_mcp_server(task.organization_id),
            "project": get_project_mcp_server(task.project_id),
        },

        # Hooks for coordination
        hooks={
            "PreToolUse": [
                HookMatcher(matcher="Bash", hooks=[validate_bash_command]),
                HookMatcher(matcher="Write", hooks=[track_file_changes]),
            ],
            "PostToolUse": [
                HookMatcher(hooks=[emit_progress_event]),
            ],
        },

        # Session management
        enable_file_checkpointing=True,

        # System prompt with task context
        system_prompt=build_agent_prompt(task),
    )

    async for message in query(
        prompt=build_task_prompt(task),
        options=options
    ):
        yield message
```

### 3.2 Agent Types & Specialization

```python
AGENT_DEFINITIONS = {
    "planner": AgentDefinition(
        description="Breaks features into implementable tasks",
        prompt="You are a senior software architect...",
        tools=["Read", "Grep", "Glob", "mcp__sibyl__add"],
        model="opus"  # Use Opus for planning
    ),

    "implementer": AgentDefinition(
        description="Implements code changes",
        prompt="You are a senior developer...",
        tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
        model="sonnet"  # Sonnet for speed on implementation
    ),

    "tester": AgentDefinition(
        description="Writes and runs tests",
        prompt="You are a QA engineer...",
        tools=["Read", "Write", "Edit", "Bash"],
        model="sonnet"
    ),

    "reviewer": AgentDefinition(
        description="Reviews code for quality and security",
        prompt="You are a code reviewer...",
        tools=["Read", "Grep", "Glob"],
        model="opus"  # Opus for deep analysis
    ),

    "integrator": AgentDefinition(
        description="Merges worktrees and resolves conflicts",
        prompt="You are a git expert...",
        tools=["Bash", "Read", "Write"],
        model="sonnet"
    ),
}
```

### 3.3 Inter-Agent Communication via Sibyl

Agents don't talk directly. They communicate through Sibyl:

```python
# Agent adds a note to a task
await sibyl_client.add(
    entity_type="note",
    content="Found 3 edge cases that need handling...",
    task=current_task_id,
    author_type="agent",
    author_name="implementer-001"
)

# Another agent discovers this via search
results = await sibyl_client.search(
    query="edge cases",
    entity_type="note",
    task=current_task_id
)
```

---

## 4. Multi-Agent Orchestration

### 4.1 On-Demand Agent Spawning

Agents are created on-demand (not pooled) via two paths:

**Path 1: Orchestrator-Initiated**

- Orchestrator analyzes task graph and spawns workers as needed
- Automatically scales based on parallelizable work
- Terminates agents when work completes

**Path 2: User-Initiated**

- User clicks "Start Agent" with a prompt
- Direct chat session with new Claude instance
- Can work on ad-hoc tasks or assigned Sibyl tasks

```python
class AgentSpawner:
    """Create Claude instances on-demand."""

    async def spawn_for_task(
        self,
        task: Task,
        agent_type: str = "implementer"
    ) -> AgentInstance:
        """Orchestrator spawns agent for specific task."""
        worktree = await self.worktree_manager.create(task.id)

        return await self._create_agent(
            agent_type=agent_type,
            worktree=worktree,
            task=task,
            spawn_source="orchestrator"
        )

    async def spawn_for_user(
        self,
        prompt: str,
        project_id: str,
        task_id: str | None = None
    ) -> AgentInstance:
        """User spawns agent directly with a prompt."""
        # Optional: attach to existing task
        task = await self.sibyl.get_task(task_id) if task_id else None

        # Create worktree if working on code
        worktree = None
        if task or self._prompt_needs_worktree(prompt):
            worktree = await self.worktree_manager.create(
                task.id if task else f"adhoc-{uuid4().hex[:8]}"
            )

        return await self._create_agent(
            agent_type="general",
            worktree=worktree,
            task=task,
            initial_prompt=prompt,
            spawn_source="user"
        )
```

### 4.2 Agent Organization

Agents are organized hierarchically by **Organization → Project**:

```
Organization (Acme Corp)
├── Project: auth-service
│   ├── 🤖 implementer-001 (task: OAuth2)
│   ├── 🤖 tester-001 (task: Auth tests)
│   └── 🤖 adhoc-abc (user prompt)
├── Project: frontend-app
│   └── 🤖 implementer-002 (task: Dashboard)
└── Project: shared-libs
    └── (no active agents)
```

This enables:

- **Project-scoped views** in the UI
- **Resource limits per project** (max agents, budget)
- **Cross-project awareness** for the orchestrator
- **Isolation** between projects' worktrees

### 4.3 Orchestrator Design

The **Orchestrator** manages on-demand agent creation and coordination:

```python
class AgentOrchestrator:
    """Central coordinator for multi-agent execution."""

    def __init__(self, org_id: str, project_id: str):
        self.org_id = org_id
        self.project_id = project_id
        self.agents: dict[str, AgentInstance] = {}
        self.worktree_manager = WorktreeManager(project_path)

    async def plan_feature(self, feature_description: str) -> list[Task]:
        """Use planning agent to break feature into tasks."""
        planner = await self.spawn_agent("planner")

        tasks = await planner.execute(
            prompt=f"Break this feature into implementable tasks:\n\n{feature_description}",
            structured_output=TaskListSchema
        )

        # Create tasks in Sibyl with dependencies
        for task in tasks:
            await self.sibyl.add(entity_type="task", **task.dict())

        return tasks

    async def execute_parallel(self, tasks: list[Task], max_agents: int = 4):
        """Execute independent tasks in parallel."""

        # Build dependency graph
        ready_tasks = [t for t in tasks if not t.depends_on]

        async with asyncio.TaskGroup() as tg:
            for task in ready_tasks[:max_agents]:
                tg.create_task(self.execute_task(task))

    async def execute_task(self, task: Task) -> TaskResult:
        """Execute a single task with a dedicated agent."""

        # 1. Claim task in Sibyl
        claimed = await self.claim_task(task.id)
        if not claimed:
            return TaskResult(status="already_claimed")

        # 2. Create isolated worktree
        worktree = await self.worktree_manager.create(task.id)

        # 3. Spawn agent
        agent = await self.spawn_agent(
            agent_type="implementer",
            worktree=worktree,
            task=task
        )

        # 4. Execute with progress tracking
        try:
            result = await agent.execute()

            # 5. Run tests
            if result.success:
                test_result = await self.run_tests(worktree)
                if not test_result.passed:
                    result = await agent.fix_tests(test_result.failures)

            # 6. Submit for review
            await self.submit_for_review(task, result)

            return result

        except Exception as e:
            await self.handle_failure(task, e)
            raise
        finally:
            # 7. Update task status
            await self.complete_task(task.id, result)
```

### 4.2 Agent Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AGENT LIFECYCLE                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [IDLE] ──claim task──> [INITIALIZING] ──worktree ready──> [WORKING] │
│                                                                  │    │
│                              ┌──────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│  [BLOCKED] <──needs help── [WORKING] ──done──> [REVIEWING]           │
│      │                        │                      │                │
│      │                        │                      ▼                │
│      └──unblocked──> [WORKING]│              [INTEGRATING]           │
│                               │                      │                │
│                               │                      ▼                │
│                               └──failed──> [FAILED] [COMPLETED]      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.6 Human-in-the-Loop System

The Human-in-the-Loop (HITL) layer ensures human oversight at critical points while allowing
autonomous operation for routine work.

#### 4.6.1 Unified Approval Queue

All agent requests flow through a single, tabbed queue interface:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔔 Approval Queue                                          [Mark All Read] │
├─────────────────────────────────────────────────────────────────────────────┤
│  [All (5)] [⚠️ Pending (3)] [✅ Approved] [❌ Denied] [⏳ Expired]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ⚠️ APPROVAL REQUIRED                                    2 min ago      ││
│  │  Agent: implementer-001 · Project: auth-service                         ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  Action: Execute bash command                                            ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  rm -rf node_modules && pnpm install                                │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │  Risk: 🟡 Medium (destructive command pattern)                           ││
│  │  Context: Agent is fixing dependency conflict                            ││
│  │                                                                          ││
│  │  [✅ Approve] [❌ Deny] [✏️ Edit Command] [💬 Ask Agent] [View Context]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  🔍 REVIEW REQUESTED                                     5 min ago      ││
│  │  Agent: implementer-002 · Project: frontend-app                         ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  Round Complete: "Implement dashboard charts"                            ││
│  │  Files Changed: 4 (+234, -12)                                           ││
│  │  Tests: ✅ 12 passed                                                    ││
│  │                                                                          ││
│  │  [👀 Review Changes] [✅ Approve & Continue] [🔄 Request Changes]        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  💬 QUESTION                                             8 min ago      ││
│  │  Agent: planner-001 · Project: auth-service                              ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  "Should I use OAuth2 or OpenID Connect for the SSO implementation?     ││
│  │   OAuth2 is simpler but OIDC provides identity verification."           ││
│  │                                                                          ││
│  │  [Type your response...]                                     [Send]     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 4.6.2 Approval Types

```python
class ApprovalType(StrEnum):
    """Types of human approval requests."""

    # Risk-based triggers
    DESTRUCTIVE_COMMAND = "destructive_command"    # rm -rf, force push, etc.
    SENSITIVE_FILE = "sensitive_file"              # .env, secrets, creds
    EXTERNAL_API = "external_api"                  # Calling external services
    COST_THRESHOLD = "cost_threshold"              # Approaching budget limit

    # Agent-requested
    REVIEW_PHASE = "review_phase"                  # Agent completed a round
    QUESTION = "question"                          # Agent needs clarification
    SCOPE_CHANGE = "scope_change"                  # Work exceeds original task

    # System-initiated
    MERGE_CONFLICT = "merge_conflict"              # Needs human resolution
    TEST_FAILURE = "test_failure"                  # Tests failed after changes
```

#### 4.6.3 Review Phase

Agents can explicitly request human review at natural breakpoints:

```python
async def request_review_phase(
    agent_id: str,
    round_description: str,
    changes_summary: dict
) -> ApprovalRequest:
    """Agent requests human review of completed work."""

    # Collect context
    diff_stats = await git_diff_stats(agent_worktree)
    test_results = await run_tests(agent_worktree)

    # Create approval request
    request = ApprovalRequest(
        type=ApprovalType.REVIEW_PHASE,
        agent_id=agent_id,
        project_id=agent.project_id,
        title=f"Review: {round_description}",
        summary=changes_summary,
        metadata={
            "files_changed": diff_stats.files,
            "insertions": diff_stats.insertions,
            "deletions": diff_stats.deletions,
            "test_results": test_results.to_dict(),
        },
        actions=["approve_continue", "request_changes", "view_diff", "chat"],
        timeout_minutes=60,  # Auto-expire if no response
    )

    await approval_queue.enqueue(request)

    # Agent pauses until approval
    response = await approval_queue.wait_for_response(request.id)

    if response.action == "request_changes":
        # Agent receives feedback and continues
        return ApprovalResult(
            approved=False,
            feedback=response.message,
            continue_work=True
        )

    return ApprovalResult(approved=True)
```

#### 4.6.4 Agent-Initiated Checkpoints

Agents can proactively pause for human input:

```python
# In agent system prompt
CHECKPOINT_INSTRUCTIONS = """
Request human review when:
1. You've completed a logical unit of work (e.g., finished implementing a feature)
2. You're about to make a significant architectural decision
3. You're unsure about requirements or approach
4. You've hit an unexpected error or blocker
5. Tests are failing and you're not sure why

Use the request_review tool with a clear summary of:
- What you've accomplished
- What you're planning next
- Any questions or concerns
"""

# Agent tool for requesting review
@tool
async def request_review(
    summary: str,
    questions: list[str] | None = None,
    blocking: bool = True
) -> ReviewResponse:
    """Request human review of current progress.

    Args:
        summary: What you've accomplished and current state
        questions: Optional list of questions for the reviewer
        blocking: If True, pause until human responds
    """
    return await hitl.request_review_phase(
        round_description=summary,
        questions=questions,
        blocking=blocking
    )
```

#### 4.6.5 Approval Flow

```
Agent Action
     │
     ▼
┌────────────┐     No      ┌───────────┐
│ Needs      │────────────►│ Execute   │
│ Approval?  │             │ Directly  │
└────────────┘             └───────────┘
     │ Yes
     ▼
┌────────────────┐
│ Create Request │
│ + Enqueue      │
└────────────────┘
     │
     ▼
┌────────────────┐     Timeout     ┌───────────────┐
│ Wait for       │────────────────►│ Auto-Deny or  │
│ Human Response │                 │ Escalate      │
└────────────────┘                 └───────────────┘
     │
     ▼
┌────────────┐
│ Response   │
│ Received   │
└────────────┘
     │
     ├──► Approved ──► Continue Execution
     │
     ├──► Denied ──► Log + Skip Action
     │
     ├──► Edit ──► Execute Modified Action
     │
     └──► Chat ──► Agent Receives Message ──► Retry Decision
```

#### 4.6.6 Notification System

```python
class ApprovalNotifier:
    """Multi-channel notification for pending approvals."""

    async def notify(self, request: ApprovalRequest):
        # In-app notification (always)
        await self.websocket_broadcast(request)

        # Browser notification if tab not focused
        if self.user_settings.browser_notifications:
            await self.send_browser_notification(request)

        # Email for high-priority or stale requests
        if request.priority == "high" or request.age_minutes > 30:
            await self.send_email(request)

        # Slack/Discord integration (if configured)
        if self.integrations.slack:
            await self.send_slack(request)

    async def escalate_stale(self, request: ApprovalRequest):
        """Escalate requests that have been pending too long."""
        if request.age_minutes > 60:
            # Notify additional team members
            await self.notify_team(request, escalation_level=1)

        if request.age_minutes > 120:
            # Auto-pause agent to avoid wasted compute
            await self.pause_agent(request.agent_id)
```

---

## 5. Git Worktree Strategy

### 5.1 Worktree Isolation Model

```
~/dev/sibyl/                        # Main repo (main branch)
├── .git/                           # Shared git database
└── ...

~/.sibyl-worktrees/                 # Agent worktrees (sibling to avoid nesting)
├── task_abc123/                    # Agent 1's workspace
│   ├── .venv/                      # Isolated Python env
│   ├── node_modules/               # Isolated Node deps
│   └── ...                         # Full repo checkout
├── task_def456/                    # Agent 2's workspace
└── integration/                    # Merge staging area
```

### 5.2 Worktree Manager

```python
class WorktreeManager:
    """Manage git worktrees for parallel agent execution."""

    def __init__(self, repo_path: Path, worktree_base: Path):
        self.repo = repo_path
        self.base = worktree_base
        self.base.mkdir(parents=True, exist_ok=True)

    async def create(self, task_id: str) -> Worktree:
        """Create isolated worktree for a task."""
        branch = f"agent/{task_id}"
        path = self.base / task_id

        # Fetch latest from origin
        await self._git(["fetch", "origin", "main"])

        # Create worktree with new branch from origin/main
        await self._git([
            "worktree", "add", "-b", branch,
            str(path), "origin/main"
        ])

        # Install dependencies
        await self._install_deps(path)

        return Worktree(
            task_id=task_id,
            branch=branch,
            path=path,
            created_at=datetime.now(UTC)
        )

    async def cleanup(self, task_id: str):
        """Remove worktree after task completion."""
        path = self.base / task_id
        branch = f"agent/{task_id}"

        await self._git(["worktree", "remove", "--force", str(path)])
        await self._git(["worktree", "prune"])

        # Delete branch if merged
        try:
            await self._git(["branch", "-d", branch])
        except subprocess.CalledProcessError:
            pass  # Branch not merged or doesn't exist

    async def check_conflicts(self, branch_a: str, branch_b: str) -> bool:
        """Pre-check if branches would conflict."""
        merge_base = await self._git(["merge-base", branch_a, branch_b])
        result = await self._git(
            ["merge-tree", merge_base.strip(), branch_a, branch_b],
            check=False
        )
        return "<<<<<<<" in result
```

### 5.3 Integration Strategy

```python
class IntegrationManager:
    """Coordinate merging of agent worktrees."""

    async def integrate_task(self, task_id: str, target: str = "main"):
        """Integrate a completed task's branch."""
        branch = f"agent/{task_id}"

        # 1. Pre-check for conflicts
        has_conflicts = await self.worktrees.check_conflicts(branch, target)

        if has_conflicts:
            # Create merge request for human review
            return await self.create_conflict_review(task_id, branch, target)

        # 2. Rebase onto target
        await self._git(["checkout", branch])
        await self._git(["rebase", target])

        # 3. Run full test suite
        test_result = await self.run_tests()
        if not test_result.passed:
            return await self.create_test_failure_review(task_id, test_result)

        # 4. Fast-forward merge
        await self._git(["checkout", target])
        await self._git(["merge", "--ff-only", branch])

        # 5. Cleanup
        await self.worktrees.cleanup(task_id)

        return IntegrationResult(status="success", commit=await self._git(["rev-parse", "HEAD"]))

    async def integrate_batch(self, task_ids: list[str], target: str = "main"):
        """Integrate multiple tasks in dependency order."""

        # Build dependency graph
        tasks = [await self.sibyl.get_task(tid) for tid in task_ids]
        sorted_tasks = topological_sort(tasks)

        for task in sorted_tasks:
            result = await self.integrate_task(task.id, target)
            if result.status != "success":
                return result  # Stop on first failure

        return IntegrationResult(status="success", count=len(task_ids))
```

---

## 6. Task Coordination via Sibyl

### 6.1 Extended Task Model

```python
class Task(Entity):
    # ... existing fields ...

    # Agent coordination (NEW)
    assigned_agent: str | None = Field(default=None, description="Agent ID currently working")
    claimed_at: datetime | None = Field(default=None, description="When agent claimed task")
    heartbeat_at: datetime | None = Field(default=None, description="Last agent heartbeat")

    # Worktree tracking (NEW)
    worktree_path: str | None = Field(default=None, description="Path to agent's worktree")
    worktree_branch: str | None = Field(default=None, description="Git branch name")

    # Multi-agent collaboration (NEW)
    collaborators: list[str] = Field(default_factory=list, description="Other agents involved")
    handoff_history: list[dict] = Field(default_factory=list, description="Agent handoff log")

    # Checkpointing (NEW)
    last_checkpoint: dict | None = Field(default=None, description="Last saved progress state")
```

### 6.2 Optimistic Task Claiming

```python
async def claim_task(task_id: str, agent_id: str) -> Task | None:
    """Claim task using optimistic locking (no contention)."""

    result = await graph.execute_write_org("""
        MATCH (t:Task {uuid: $task_id})
        WHERE t.status IN ['todo', 'backlog']
          AND (t.assigned_agent IS NULL OR t.assigned_agent = '')
        SET t.status = 'doing',
            t.assigned_agent = $agent_id,
            t.claimed_at = datetime(),
            t.heartbeat_at = datetime()
        RETURN t
    """, org_id, task_id=task_id, agent_id=agent_id)

    if result:
        # Emit event for UI update
        await emit_task_event(org_id, task_id, "task_claimed", agent_id)
        return Task.from_node(result[0])

    return None
```

### 6.3 Agent Health Monitoring

```python
class AgentHealthMonitor:
    """Detect dead agents and reclaim their tasks."""

    HEARTBEAT_INTERVAL = 30  # seconds
    STALE_THRESHOLD = 90     # 3 missed heartbeats
    DEAD_THRESHOLD = 300     # 5 minutes

    async def run_health_check_loop(self):
        """Background task to monitor agent health."""
        while True:
            await asyncio.sleep(self.HEARTBEAT_INTERVAL)

            # Find stale tasks
            stale_tasks = await self.graph.execute_read_org("""
                MATCH (t:Task)
                WHERE t.status = 'doing'
                  AND t.heartbeat_at < datetime() - duration('PT5M')
                RETURN t.uuid as task_id, t.assigned_agent as agent_id
            """, self.org_id)

            for task in stale_tasks:
                await self.reclaim_task(task["task_id"], task["agent_id"])

    async def reclaim_task(self, task_id: str, dead_agent_id: str):
        """Return task to queue after agent death."""
        await self.graph.execute_write_org("""
            MATCH (t:Task {uuid: $task_id})
            SET t.status = 'todo',
                t.assigned_agent = NULL,
                t.reclaim_reason = 'agent_dead',
                t.reclaimed_at = datetime()
        """, self.org_id, task_id=task_id)

        await emit_task_event(self.org_id, task_id, "task_abandoned", dead_agent_id)
```

---

## 7. Web UI: Agents Page

### 7.1 Navigation Addition

```typescript
// apps/web/src/components/layout/sidebar.tsx
const NAVIGATION = [
  // ... existing items ...
  { name: "Agents", href: "/agents", icon: Bot }, // NEW
];
```

### 7.2 Agent Dashboard Layout (Project-Organized)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 Agents                                              [+ Start Agent]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Organization: Acme Corp                                                ││
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ┌────────────────────────────┐   ││
│  │  │ 🟢 3 │ │ 🟡 1 │ │ 🔴 0 │ │ ⏸ 2 │  │ 🔔 3 Pending Approvals    │   ││
│  │  │Active│ │Waiting│ │Failed│ │Paused│  └────────────────────────────┘   ││
│  │  └──────┘ └──────┘ └──────┘ └──────┘                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📁 auth-service                                      2 agents active   ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  🤖 implementer-001                              [Pause] [Stop]     │││
│  │  │  Task: "Add OAuth2 authentication"                                  │││
│  │  │  Status: 🟢 Working · 23m elapsed · 47% complete                    │││
│  │  │  ┌─────────────────────────────────────────────────────────────────┐│││
│  │  │  │ Latest: "Writing auth middleware... ▊"                          ││││
│  │  │  └─────────────────────────────────────────────────────────────────┘│││
│  │  │  [View Logs] [Open Chat] [View Diff]                                │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  🤖 tester-001 · 🟡 Waiting for implementer-001                     │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📁 frontend-app                                      1 agent active    ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  🤖 implementer-002 · 🔍 Review requested · [Review Now]            │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  📁 shared-libs                                       0 agents          ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  No active agents. [+ Start Agent]                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Activity Feed (all projects)                           [Expand]       ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  10:45:23  auth-service/implementer-001  ✏️  Modified: oauth.py        ││
│  │  10:45:21  auth-service/implementer-001  📝  Created: tokens.py        ││
│  │  10:44:12  frontend-app/implementer-002  🔍  Requested review          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Resource Usage                                                         ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  Tokens:  45,230 / 100,000 (45%)  │  Cost: $2.45 / $10.00 budget       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Start Agent Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Start New Agent                                                     [✕]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Project:    [auth-service ▼]                                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  What would you like the agent to work on?                              ││
│  │                                                                          ││
│  │  │ Implement rate limiting middleware for the API endpoints.            ││
│  │  │ Use Redis for distributed rate tracking. Add tests.                  ││
│  │  │                                                                      ││
│  │  └──────────────────────────────────────────────────────────────────────││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Options:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  □ Attach to existing task:  [Select task... ▼]                         ││
│  │  ☑ Create worktree (isolated git branch)                                ││
│  │  □ Request review after each round                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│                                          [Cancel]  [🚀 Start Agent]         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Approval Queue Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔔 Approval Queue                                      [Mark All Read]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [All (5)] [⚠️ Pending (3)] [✅ Approved (12)] [❌ Denied (2)] [⏳ Expired] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ⚠️ APPROVAL REQUIRED · auth-service                     2 min ago      ││
│  │  Agent: implementer-001                                                  ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  Action: Execute bash command                                            ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │  rm -rf node_modules && pnpm install                                │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │  Risk: 🟡 Medium                                                         ││
│  │  Context: Agent is fixing dependency conflict after adding new package   ││
│  │                                                                          ││
│  │  [✅ Approve] [❌ Deny] [✏️ Edit] [💬 Ask Agent] [📋 View Full Context]  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  🔍 REVIEW REQUESTED · frontend-app                      5 min ago      ││
│  │  Agent: implementer-002                                                  ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  Round Complete: "Implement dashboard charts component"                  ││
│  │                                                                          ││
│  │  Summary:                                                                ││
│  │  • Created ChartCard component with responsive layout                    ││
│  │  • Added bar, line, and pie chart types using Recharts                   ││
│  │  • Integrated with React Query for data fetching                         ││
│  │                                                                          ││
│  │  Files: 4 changed (+234, -12)  │  Tests: ✅ 12 passed                    ││
│  │                                                                          ││
│  │  [👀 Review Diff] [✅ Approve & Continue] [🔄 Request Changes]           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  💬 QUESTION · auth-service                              8 min ago      ││
│  │  Agent: planner-001                                                      ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  "Should I use OAuth2 or OpenID Connect for SSO? OAuth2 is simpler      ││
│  │   but OIDC provides identity verification out of the box."              ││
│  │                                                                          ││
│  │  Your response:                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐││
│  │  │                                                                     │││
│  │  └─────────────────────────────────────────────────────────────────────┘││
│  │                                                                  [Send] ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Agent Chat Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 implementer-001 · "Add OAuth2 authentication"          [⏸ Pause] [✕]  │
├───────────────────────────────────┬─────────────────────────────────────────┤
│                                   │                                          │
│  Chat                             │  Workspace                               │
│  ───────────────────────────────  │  ───────────────────────────────────────│
│                                   │                                          │
│  🤖 Agent:                        │  apps/api/src/auth/oauth.py              │
│  I've analyzed the codebase and   │  ─────────────────────────────────────  │
│  found the existing auth module.  │  1  from fastapi import Depends          │
│  I'll extend it with OAuth2.      │  2  from .tokens import create_token     │
│                                   │  3                                        │
│  Creating `oauth.py` with:        │  4  class OAuth2Handler:                 │
│  - Google provider                │  5      def __init__(self, config):      │
│  - GitHub provider                │  6          self.config = config         │
│  - Token refresh flow             │  7          ...                          │
│                                   │                                          │
│  🤖 Agent is typing...            │  [📁 Files] [📝 Diff] [🖥️ Terminal]     │
│  ─────────────────────────────────│                                          │
│                                   │                                          │
│  You:                             │  ┌─────────────────────────────────────┐│
│  │                             │  │  │  Changes (3 files)                  ││
│  └─────────────────────────────┘  │  │  ✚ oauth.py (+145)                  ││
│                                   │  │  ✚ tokens.py (+67)                  ││
│  [Send] [Pause Agent]             │  │  ~ middleware.py (+12, -3)          ││
│                                   │  └─────────────────────────────────────┘│
└───────────────────────────────────┴──────────────────────────────────────────┘
```

### 7.4 Real-time Updates via WebSocket

```typescript
// apps/web/src/hooks/useAgentEvents.ts
export function useAgentEvents(orgId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`/api/ws/agents/${orgId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "agent_status":
          queryClient.invalidateQueries(["agents", data.agentId]);
          break;
        case "task_progress":
          queryClient.invalidateQueries(["tasks", data.taskId]);
          break;
        case "approval_required":
          toast.warning(`Agent ${data.agentId} needs approval`);
          break;
        case "agent_output":
          // Stream to chat interface
          break;
      }
    };

    return () => ws.close();
  }, [orgId, queryClient]);
}
```

---

## 8. Persistence & Recovery

The Agent Harness must survive system reboots without losing state or work-in-progress.

### 8.1 State Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STATE PERSISTENCE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  DURABLE STATE (FalkorDB + PostgreSQL)                                  ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  • Agent records (id, type, project, task, status, config)              ││
│  │  • Approval queue items (pending, history)                              ││
│  │  • Session checkpoints (conversation state, tool history)               ││
│  │  • Worktree registry (path, branch, task mapping)                       ││
│  │  • Task assignments (claimed_by, heartbeat_at)                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  EPHEMERAL STATE (Redis)                                                ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  • Active WebSocket connections                                         ││
│  │  • Real-time event streams                                              ││
│  │  • Rate limiting counters                                               ││
│  │  • Distributed locks (rebuilt on startup)                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  FILESYSTEM STATE (Git Worktrees)                                       ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  • Code changes (committed and uncommitted)                             ││
│  │  • Branch state (survives reboot)                                       ││
│  │  • Stashed work (auto-stash before shutdown if needed)                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Agent State Model

```python
class AgentRecord(BaseModel):
    """Persistent agent state stored in database."""

    id: str = Field(description="Unique agent identifier")
    organization_id: str
    project_id: str
    agent_type: str  # implementer, tester, reviewer, etc.
    spawn_source: str  # "orchestrator" or "user"

    # Assignment
    task_id: str | None = None
    worktree_path: str | None = None
    worktree_branch: str | None = None

    # Lifecycle
    status: AgentStatus  # initializing, working, paused, waiting_approval, completed, failed
    created_at: datetime
    started_at: datetime | None = None
    last_heartbeat: datetime | None = None
    completed_at: datetime | None = None

    # Session (for resume)
    session_id: str | None = None  # Claude Agent SDK session ID
    checkpoint_id: str | None = None  # Last checkpoint for resume
    conversation_turns: int = 0

    # Context
    initial_prompt: str
    system_prompt_hash: str  # Detect if prompt changed

    # Cost tracking
    tokens_used: int = 0
    cost_usd: float = 0.0


class AgentStatus(StrEnum):
    """Agent lifecycle states (persisted)."""

    INITIALIZING = "initializing"    # Setting up worktree
    WORKING = "working"              # Actively executing
    PAUSED = "paused"                # User paused
    WAITING_APPROVAL = "waiting_approval"  # Blocked on human
    WAITING_DEPENDENCY = "waiting_dependency"  # Blocked on another task
    RESUMING = "resuming"            # Recovering after restart
    COMPLETED = "completed"          # Finished successfully
    FAILED = "failed"                # Error state
    TERMINATED = "terminated"        # User stopped
```

### 8.3 Session Checkpointing

Leverage Claude Agent SDK's session management for resumability:

```python
class AgentCheckpointManager:
    """Persist and restore agent sessions."""

    async def checkpoint(self, agent: AgentInstance) -> str:
        """Save agent state for later resume."""

        checkpoint = AgentCheckpoint(
            agent_id=agent.id,
            session_id=agent.session_id,
            timestamp=datetime.now(UTC),

            # Conversation state
            conversation_history=agent.get_conversation_history(),
            pending_tool_calls=agent.get_pending_tools(),

            # Work state
            files_modified=await self._get_modified_files(agent.worktree),
            uncommitted_changes=await self._get_uncommitted_diff(agent.worktree),

            # Progress
            current_step=agent.current_step,
            completed_steps=agent.completed_steps,

            # Approval state
            pending_approval_id=agent.pending_approval_id,
        )

        # Store in database
        await self.db.save_checkpoint(checkpoint)

        # Update agent record
        await self.db.update_agent(agent.id, checkpoint_id=checkpoint.id)

        return checkpoint.id

    async def restore(self, agent_id: str) -> AgentInstance:
        """Restore agent from last checkpoint."""

        record = await self.db.get_agent(agent_id)
        checkpoint = await self.db.get_checkpoint(record.checkpoint_id)

        # Verify worktree still exists
        if not Path(record.worktree_path).exists():
            raise WorktreeMissingError(f"Worktree gone: {record.worktree_path}")

        # Recreate agent with session resume
        agent = await self.spawner.create_agent(
            agent_type=record.agent_type,
            worktree_path=record.worktree_path,
            task_id=record.task_id,
            # Resume from checkpoint
            resume_session_id=checkpoint.session_id,
            conversation_history=checkpoint.conversation_history,
        )

        # Restore approval wait if needed
        if checkpoint.pending_approval_id:
            await self.approval_queue.reattach(
                checkpoint.pending_approval_id,
                agent
            )

        return agent
```

### 8.4 Startup Recovery Flow

```python
class AgentHarnessRecovery:
    """Recover agent harness state after system restart."""

    async def recover(self):
        """Full recovery sequence on startup."""

        logger.info("🔄 Starting Agent Harness recovery...")

        # 1. Rebuild ephemeral state
        await self._rebuild_locks()
        await self._clear_stale_connections()

        # 2. Audit worktrees
        worktree_status = await self._audit_worktrees()

        # 3. Find agents that need recovery
        agents_to_recover = await self.db.query_agents(
            status__in=[
                AgentStatus.WORKING,
                AgentStatus.WAITING_APPROVAL,
                AgentStatus.WAITING_DEPENDENCY,
                AgentStatus.PAUSED,
            ]
        )

        logger.info(f"📋 Found {len(agents_to_recover)} agents to recover")

        # 4. Recover each agent
        for record in agents_to_recover:
            try:
                await self._recover_agent(record, worktree_status)
            except Exception as e:
                logger.error(f"❌ Failed to recover agent {record.id}: {e}")
                await self._mark_agent_failed(record.id, str(e))

        # 5. Resume approval queue processing
        await self.approval_queue.resume()

        # 6. Notify orchestrator of recovered state
        await self.orchestrator.on_recovery_complete()

        logger.info("✅ Agent Harness recovery complete")

    async def _recover_agent(
        self,
        record: AgentRecord,
        worktree_status: dict
    ):
        """Recover a single agent."""

        # Check worktree health
        wt = worktree_status.get(record.worktree_path)
        if not wt or not wt.exists:
            # Worktree missing - cannot recover
            await self._mark_agent_failed(
                record.id,
                "Worktree missing after restart"
            )
            return

        # Mark as resuming
        await self.db.update_agent(record.id, status=AgentStatus.RESUMING)

        if record.status == AgentStatus.PAUSED:
            # Leave paused, just update registry
            logger.info(f"⏸️  Agent {record.id} remains paused")
            return

        if record.status == AgentStatus.WAITING_APPROVAL:
            # Re-register with approval queue, don't resume yet
            await self.approval_queue.reattach_waiter(record.id)
            logger.info(f"⏳ Agent {record.id} waiting for approval")
            return

        # Resume active agent
        agent = await self.checkpoint_manager.restore(record.id)

        # Inject recovery context
        await agent.inject_message(
            role="system",
            content=f"""
            [SYSTEM RECOVERY]
            The system was restarted. You are resuming from your last checkpoint.

            Your worktree is intact at: {record.worktree_path}
            Last known state: {record.status}
            Time since last activity: {datetime.now(UTC) - record.last_heartbeat}

            Please verify your work state and continue from where you left off.
            """
        )

        # Resume execution
        await self.orchestrator.resume_agent(agent)
        logger.info(f"▶️  Agent {record.id} resumed")

    async def _audit_worktrees(self) -> dict[str, WorktreeHealth]:
        """Check health of all registered worktrees."""

        registered = await self.db.get_all_worktrees()
        results = {}

        for wt in registered:
            path = Path(wt.path)
            results[wt.path] = WorktreeHealth(
                exists=path.exists(),
                branch_exists=await self._check_branch(wt.branch),
                has_uncommitted=await self._has_uncommitted(path) if path.exists() else False,
                last_commit=await self._get_last_commit(path) if path.exists() else None,
            )

        return results
```

### 8.5 Graceful Shutdown

```python
class AgentHarnessShutdown:
    """Graceful shutdown with state preservation."""

    async def shutdown(self, timeout_seconds: int = 30):
        """Gracefully shut down all agents."""

        logger.info("🛑 Initiating graceful shutdown...")

        # 1. Stop accepting new work
        await self.orchestrator.stop_accepting()

        # 2. Pause all active agents
        active_agents = await self.db.query_agents(status=AgentStatus.WORKING)

        for agent in active_agents:
            try:
                # Request agent to pause at next safe point
                await agent.request_pause(reason="system_shutdown")

                # Wait for acknowledgment (with timeout)
                await asyncio.wait_for(
                    agent.wait_for_pause(),
                    timeout=timeout_seconds / len(active_agents)
                )

                # Checkpoint
                await self.checkpoint_manager.checkpoint(agent)

                # Commit any uncommitted work
                await self._safe_commit(agent.worktree, "WIP: System shutdown checkpoint")

            except asyncio.TimeoutError:
                logger.warning(f"⚠️  Agent {agent.id} didn't pause in time, force checkpointing")
                await self.checkpoint_manager.checkpoint(agent)

        # 3. Update all agent statuses
        await self.db.bulk_update_agents(
            [a.id for a in active_agents],
            status=AgentStatus.PAUSED,
            paused_reason="system_shutdown"
        )

        # 4. Persist approval queue state
        await self.approval_queue.persist()

        logger.info("✅ Graceful shutdown complete")
```

### 8.6 Data Models for Persistence

```python
# New database tables/graph nodes needed

class WorktreeRecord(BaseModel):
    """Persistent worktree registry."""

    id: str
    task_id: str
    agent_id: str | None
    path: str
    branch: str
    base_commit: str  # Commit worktree was created from
    created_at: datetime
    last_used: datetime
    status: str  # active, orphaned, merged, deleted


class ApprovalRecord(BaseModel):
    """Persistent approval queue item."""

    id: str
    organization_id: str
    project_id: str
    agent_id: str
    type: ApprovalType
    priority: str

    # Request details
    title: str
    summary: str
    metadata: dict
    actions: list[str]

    # Lifecycle
    created_at: datetime
    expires_at: datetime | None
    responded_at: datetime | None
    response: str | None  # approved, denied, edited
    response_by: str | None  # user who responded
    response_message: str | None


class AgentCheckpoint(BaseModel):
    """Snapshot of agent state for resume."""

    id: str
    agent_id: str
    session_id: str
    timestamp: datetime

    # Conversation
    conversation_history: list[dict]  # Serialized messages
    pending_tool_calls: list[dict]

    # Work state
    files_modified: list[str]
    uncommitted_changes: str  # Git diff

    # Progress
    current_step: str | None
    completed_steps: list[str]

    # Blocking state
    pending_approval_id: str | None
    waiting_for_task_id: str | None
```

---

## 9. Development Phases

### Phase 1: Foundation

**Epic: Core Agent Infrastructure**

| Task                  | Description                                           | Priority |
| --------------------- | ----------------------------------------------------- | -------- |
| Extend Task model     | Add agent fields (assigned_agent, heartbeat_at, etc.) | Critical |
| AgentRecord model     | Persistent agent state in FalkorDB                    | Critical |
| Worktree manager      | Create/cleanup worktrees for tasks                    | Critical |
| Worktree registry     | Persistent tracking of all worktrees                  | Critical |
| Agent SDK integration | Basic `query()` wrapper with Sibyl tools              | Critical |
| Task claiming         | Optimistic locking for agent task claims              | High     |
| Heartbeat system      | Agent health monitoring + reclaim                     | High     |

### Phase 2: Orchestration & Persistence

**Epic: Multi-Agent Coordination**

| Task                  | Description                             | Priority |
| --------------------- | --------------------------------------- | -------- |
| Orchestrator service  | Central coordinator process             | Critical |
| On-demand spawning    | Create agents via orchestrator or user  | Critical |
| Agent checkpointing   | Save conversation + work state          | Critical |
| Session resume        | Restore agents from checkpoints         | Critical |
| Dependency resolution | Execute tasks in correct order          | High     |
| Event bus             | Redis-based event streaming             | High     |
| Graceful shutdown     | Pause agents, checkpoint, persist queue | High     |
| Startup recovery      | Audit worktrees, resume agents          | High     |

### Phase 3: Human-in-the-Loop

**Epic: Approval System**

| Task                   | Description                     | Priority |
| ---------------------- | ------------------------------- | -------- |
| ApprovalRecord model   | Persistent queue items          | Critical |
| Approval queue service | Enqueue, wait, respond          | Critical |
| Hook integration       | Pre-tool approval triggers      | Critical |
| Review phase tool      | Agent-initiated review requests | High     |
| Notification system    | WebSocket + browser + email     | High     |
| Approval queue UI      | Tabbed interface with actions   | High     |
| Stale request handling | Escalation + auto-pause         | Medium   |

### Phase 4: Web UI

**Epic: Agent Management Interface**

| Task               | Description                        | Priority |
| ------------------ | ---------------------------------- | -------- |
| Agents page        | Project-organized dashboard        | Critical |
| Start Agent dialog | User-initiated agent spawning      | Critical |
| Agent chat         | Real-time conversation with agents | Critical |
| Activity feed      | Cross-agent action stream          | High     |
| Resource metrics   | Token usage, costs, timing         | Medium   |
| Agent controls     | Pause, resume, stop, view logs     | Medium   |

### Phase 5: Git Integration

**Epic: Worktree & Merge Operations**

| Task                   | Description                      | Priority |
| ---------------------- | -------------------------------- | -------- |
| Merge orchestration    | Rebase/merge worktrees to main   | Critical |
| Conflict detection     | Pre-check with git merge-tree    | High     |
| Conflict resolution UI | Human-assisted conflict handling | High     |
| PR creation            | Auto-create PRs from agent work  | High     |
| Test integration       | Run tests before merge           | High     |
| Cross-project agents   | Manage agents across projects    | Medium   |

---

## 10. Risk Mitigation

### Technical Risks

| Risk                | Mitigation                                   |
| ------------------- | -------------------------------------------- |
| Agent runaway costs | Budget limits with auto-pause                |
| Merge conflicts     | Pre-check with `git merge-tree`              |
| Dead agents         | Heartbeat + auto-reclaim                     |
| Context explosion   | Hierarchical compression, subagent isolation |
| Security            | Sandbox mode, file path restrictions         |

### Operational Risks

| Risk                  | Mitigation                       |
| --------------------- | -------------------------------- |
| User overwhelm        | Graduated autonomy levels        |
| Trust issues          | Transparent logs, approval gates |
| Debugging complexity  | Event replay, detailed traces    |
| Cost unpredictability | Real-time cost dashboard         |

---

## 11. Success Metrics

| Metric               | Target   | Measurement                                |
| -------------------- | -------- | ------------------------------------------ |
| Task completion rate | >85%     | Tasks completed without human intervention |
| Time to first value  | <5 min   | From feature description to first code     |
| Conflict rate        | <10%     | Merges requiring manual resolution         |
| User satisfaction    | >4/5     | Post-session ratings                       |
| Cost efficiency      | <$1/task | Average cost per completed task            |

---

## Appendix: Key Sources

**Claude Agent SDK**

- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)

**Multi-Agent Patterns**

- [Multi-Agent Orchestration: 10+ Claude Instances](https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da)
- [Devin 2.0 Architecture](https://medium.com/@takafumi.endo/agent-native-development-a-deep-dive-into-devin-2-0s-technical-design-3451587d23c0)

**UX Patterns**

- [Microsoft UX Design for Agents](https://microsoft.design/articles/ux-design-for-agents/)
- [GitHub Copilot Agent Mode](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode)

---

_This document represents the vision for Sibyl Agent Harness. Implementation details may evolve as
we learn from early prototypes._
