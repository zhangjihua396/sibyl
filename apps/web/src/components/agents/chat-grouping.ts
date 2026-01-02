/**
 * Pure functions for grouping and organizing chat messages.
 * No React dependencies - fully testable logic.
 */

import type {
  ChatMessage,
  MessageGroup,
  SubagentData,
  ToolCallMessage,
  ToolResultMessage,
} from './chat-types';
import { isTaskToolCall, isToolCallMessage, isToolResultMessage } from './chat-types';

// =============================================================================
// Results Map Builder
// =============================================================================

/** Build a map of tool_id -> result message for pairing tool calls with results */
export function buildResultsMap(messages: ChatMessage[]): Map<string, ToolResultMessage> {
  const map = new Map<string, ToolResultMessage>();
  for (const msg of messages) {
    if (isToolResultMessage(msg)) {
      map.set(msg.toolId, msg);
    }
  }
  return map;
}

// =============================================================================
// Message Grouping
// =============================================================================

/** Time window for detecting parallel agent spawns */
const PARALLEL_THRESHOLD_MS = 2000;

/**
 * Group messages to collapse subagent work using parentToolUseId.
 *
 * This function:
 * 1. Identifies Task tool calls and their nested messages
 * 2. Detects parallel agent spawns (within 2 second window)
 * 3. Groups messages appropriately for rendering
 */
export function groupMessages(
  messages: ChatMessage[],
  resultsByToolId: Map<string, ToolResultMessage>
): MessageGroup[] {
  // First pass: identify all Task tool calls and collect their nested messages
  const taskToolIds = new Set<string>();
  const nestedByParent = new Map<string, ToolCallMessage[]>();
  const taskCalls: ToolCallMessage[] = [];
  const backgroundTaskIds = new Set<string>(); // Tasks with run_in_background: true
  const pollingByTaskId = new Map<string, ToolCallMessage[]>(); // TaskOutput calls per task

  for (const msg of messages) {
    // Track Task tool calls
    if (isTaskToolCall(msg)) {
      const toolId = msg.tool.id;
      taskToolIds.add(toolId);
      nestedByParent.set(toolId, []);
      taskCalls.push(msg);

      // Track background tasks
      if (msg.subagent.runInBackground) {
        backgroundTaskIds.add(toolId);
        pollingByTaskId.set(toolId, []);
      }
    }

    // Track TaskOutput calls (polling for background agents)
    if (isToolCallMessage(msg) && msg.tool.name === 'TaskOutput') {
      const taskId = msg.subagent?.taskId;
      if (taskId && backgroundTaskIds.has(taskId)) {
        const polling = pollingByTaskId.get(taskId);
        if (polling) {
          polling.push(msg);
        }
      }
    }

    // Group messages by parentToolUseId
    if (isToolCallMessage(msg) && msg.parentToolUseId) {
      const parentId = msg.parentToolUseId;
      if (taskToolIds.has(parentId)) {
        const nested = nestedByParent.get(parentId);
        if (nested) {
          nested.push(msg);
        }
      }
    }
  }

  // Detect parallel agents (Task calls within threshold of each other)
  const parallelGroups = detectParallelGroups(taskCalls);

  // Build map of task ID to its parallel group
  const taskToParallelGroup = new Map<string, ToolCallMessage[]>();
  for (const group of parallelGroups) {
    for (const task of group) {
      taskToParallelGroup.set(task.tool.id, group);
    }
  }

  // Track which parallel groups we've already rendered
  const renderedParallelGroups = new Set<ToolCallMessage[]>();

  // Second pass: build groups, skipping messages that belong to subagents
  const groups: MessageGroup[] = [];

  for (const msg of messages) {
    // Skip tool_results (they're paired with their calls)
    if (isToolResultMessage(msg)) {
      continue;
    }

    // Skip messages that belong to a subagent (they're rendered inside SubagentBlock)
    if (isToolCallMessage(msg) && msg.parentToolUseId && taskToolIds.has(msg.parentToolUseId)) {
      continue;
    }

    // Check if this is a Task tool call (subagent spawn)
    if (isTaskToolCall(msg)) {
      const taskToolId = msg.tool.id;

      const parallelGroup = taskToParallelGroup.get(taskToolId);

      // If this is part of a parallel group with multiple agents
      if (parallelGroup && parallelGroup.length > 1) {
        // Only render once per parallel group
        if (renderedParallelGroups.has(parallelGroup)) continue;
        renderedParallelGroups.add(parallelGroup);

        const subagents: SubagentData[] = parallelGroup.map(task => {
          const id = task.tool.id;
          const polling = pollingByTaskId.get(id) ?? [];
          const lastPollResult =
            polling.length > 0
              ? resultsByToolId.get(polling[polling.length - 1].tool.id)
              : undefined;
          const lastPollStatus = lastPollResult?.status;
          return {
            taskCall: task,
            taskResult: resultsByToolId.get(id),
            nestedCalls: nestedByParent.get(id) ?? [],
            pollingCalls: polling,
            lastPollStatus,
          };
        });

        groups.push({
          kind: 'parallel_subagents',
          subagents,
          resultsByToolId,
        });
      } else {
        // Single subagent
        const taskResult = resultsByToolId.get(taskToolId);
        const nestedCalls = nestedByParent.get(taskToolId) ?? [];
        const polling = pollingByTaskId.get(taskToolId) ?? [];

        groups.push({
          kind: 'subagent',
          taskCall: msg,
          taskResult,
          nestedCalls,
          resultsByToolId,
          pollingCalls: polling,
        });
      }
    } else {
      // Regular message
      const pairedResult = isToolCallMessage(msg) ? resultsByToolId.get(msg.tool.id) : undefined;
      groups.push({ kind: 'message', message: msg, pairedResult });
    }
  }

  return groups;
}

/**
 * Detect parallel agent spawns (Task calls within threshold of each other).
 * Returns array of parallel groups, where each group has 1+ tasks.
 */
function detectParallelGroups(taskCalls: ToolCallMessage[]): ToolCallMessage[][] {
  const parallelGroups: ToolCallMessage[][] = [];
  const processedTaskIds = new Set<string>();

  for (let i = 0; i < taskCalls.length; i++) {
    const task = taskCalls[i];
    const taskId = task.tool.id;
    if (processedTaskIds.has(taskId)) continue;

    // Find all tasks within the time window
    const parallelTasks: ToolCallMessage[] = [task];
    processedTaskIds.add(taskId);

    for (let j = i + 1; j < taskCalls.length; j++) {
      const otherTask = taskCalls[j];
      const otherId = otherTask.tool.id;
      if (processedTaskIds.has(otherId)) continue;

      const timeDiff = Math.abs(task.timestamp.getTime() - otherTask.timestamp.getTime());
      if (timeDiff <= PARALLEL_THRESHOLD_MS) {
        parallelTasks.push(otherTask);
        processedTaskIds.add(otherId);
      }
    }

    parallelGroups.push(parallelTasks);
  }

  return parallelGroups;
}
