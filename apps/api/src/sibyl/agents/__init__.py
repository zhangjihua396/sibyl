"""Agent Harness infrastructure for AI agent orchestration.

This module provides the runtime infrastructure for managing AI agents:
- WorktreeManager: Isolated git worktrees for parallel agent development
- AgentRunner: Claude Agent SDK integration (coming soon)
- OrchestratorService: Multi-agent coordination (coming soon)
"""

from sibyl.agents.worktree import WorktreeManager

__all__ = ["WorktreeManager"]
