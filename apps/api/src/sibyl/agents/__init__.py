"""Agent Harness infrastructure for AI agent orchestration.

This module provides the runtime infrastructure for managing AI agents:
- WorktreeManager: Isolated git worktrees for parallel agent development
- AgentRunner: Claude Agent SDK integration for spawning and managing agents
- OrchestratorService: Multi-agent coordination (coming soon)
"""

from sibyl.agents.runner import AgentInstance, AgentRunner, AgentRunnerError
from sibyl.agents.worktree import WorktreeError, WorktreeManager

__all__ = [
    "AgentInstance",
    "AgentRunner",
    "AgentRunnerError",
    "WorktreeError",
    "WorktreeManager",
]
