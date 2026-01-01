"""Agent Harness infrastructure for AI agent orchestration.

This module provides the runtime infrastructure for managing AI agents:
- WorktreeManager: Isolated git worktrees for parallel agent development
- AgentRunner: Claude Agent SDK integration for spawning and managing agents
- ApprovalService: Human-in-the-loop approval hooks for dangerous operations
- OrchestratorService: Multi-agent coordination (coming soon)
"""

from sibyl.agents.approvals import ApprovalService
from sibyl.agents.runner import AgentInstance, AgentRunner, AgentRunnerError
from sibyl.agents.worktree import WorktreeError, WorktreeManager

__all__ = [
    "AgentInstance",
    "AgentRunner",
    "AgentRunnerError",
    "ApprovalService",
    "WorktreeError",
    "WorktreeManager",
]
