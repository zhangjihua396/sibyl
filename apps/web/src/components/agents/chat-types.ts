/**
 * Chat Message Type System
 *
 * Uses discriminated unions for type-safe message handling.
 * The `kind` field determines the message variant and enables exhaustive matching.
 */

import type { AgentMessage, ApprovalType } from '@/lib/api';
import type { Question } from './user-question-message';

// =============================================================================
// Base Types
// =============================================================================

/** Common fields for all message variants */
interface BaseMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  timestamp: Date;
}

// =============================================================================
// Message Variants (Discriminated Union)
// =============================================================================

/** Plain text message from agent, user, or system */
export interface TextMessage extends BaseMessage {
  kind: 'text';
  content: string;
}

/** Tool call initiated by agent */
export interface ToolCallMessage extends BaseMessage {
  kind: 'tool_call';
  content: string;
  tool: {
    name: string;
    id: string;
    icon?: string;
    input?: Record<string, unknown>;
  };
  /** Parent tool ID for nested calls (e.g., tools within a Task) */
  parentToolUseId?: string;
  /** Subagent info when tool is Task */
  subagent?: {
    type: string;
    runInBackground: boolean;
    taskId?: string;
  };
}

/** Result from a tool execution */
export interface ToolResultMessage extends BaseMessage {
  kind: 'tool_result';
  content: string;
  toolId: string;
  isError: boolean;
  fullContent?: string;
  status?: 'running' | 'completed' | 'failed';
  durationMs?: number;
  costUsd?: number;
}

// Question type is imported from user-question-message.tsx

/** Approval request requiring user action */
export interface ApprovalRequestMessage extends BaseMessage {
  kind: 'approval_request';
  content: string;
  approval: {
    id: string;
    type: ApprovalType;
    title: string;
    summary: string;
    status: 'pending' | 'approved' | 'denied' | 'expired';
    expiresAt?: string;
    metadata?: {
      command?: string;
      file_path?: string;
      url?: string;
      tool_name?: string;
    };
  };
}

/** User question requiring selection */
export interface UserQuestionMessage extends BaseMessage {
  kind: 'user_question';
  content: string;
  question: {
    id: string;
    questions: Question[];
    status: 'pending' | 'answered' | 'expired';
    expiresAt?: string;
    answers?: Record<string, string>;
  };
}

/** Sibyl context injection */
export interface SibylContextMessage extends BaseMessage {
  kind: 'sibyl_context';
  content: string;
}

/** Error message */
export interface ErrorMessage extends BaseMessage {
  kind: 'error';
  content: string;
}

/** Pending user message (optimistic UI) */
export interface PendingMessage extends BaseMessage {
  kind: 'pending';
  content: string;
}

// =============================================================================
// ChatMessage Union
// =============================================================================

/** All possible chat message types */
export type ChatMessage =
  | TextMessage
  | ToolCallMessage
  | ToolResultMessage
  | ApprovalRequestMessage
  | UserQuestionMessage
  | SibylContextMessage
  | ErrorMessage
  | PendingMessage;

/** Message kinds for exhaustive matching */
export type MessageKind = ChatMessage['kind'];

// =============================================================================
// Type Guards
// =============================================================================

export function isTextMessage(msg: ChatMessage): msg is TextMessage {
  return msg.kind === 'text';
}

export function isToolCallMessage(msg: ChatMessage): msg is ToolCallMessage {
  return msg.kind === 'tool_call';
}

export function isToolResultMessage(msg: ChatMessage): msg is ToolResultMessage {
  return msg.kind === 'tool_result';
}

export function isApprovalRequestMessage(msg: ChatMessage): msg is ApprovalRequestMessage {
  return msg.kind === 'approval_request';
}

export function isUserQuestionMessage(msg: ChatMessage): msg is UserQuestionMessage {
  return msg.kind === 'user_question';
}

export function isSibylContextMessage(msg: ChatMessage): msg is SibylContextMessage {
  return msg.kind === 'sibyl_context';
}

export function isErrorMessage(msg: ChatMessage): msg is ErrorMessage {
  return msg.kind === 'error';
}

export function isPendingMessage(msg: ChatMessage): msg is PendingMessage {
  return msg.kind === 'pending';
}

/** Check if message is a Task tool call (subagent spawn) */
export function isTaskToolCall(
  msg: ChatMessage
): msg is ToolCallMessage & { subagent: NonNullable<ToolCallMessage['subagent']> } {
  return msg.kind === 'tool_call' && msg.tool.name === 'Task' && msg.subagent !== undefined;
}

/** Check if message is a TaskOutput call (polling background agent) */
export function isTaskOutputCall(msg: ChatMessage): msg is ToolCallMessage {
  return msg.kind === 'tool_call' && msg.tool.name === 'TaskOutput';
}

// =============================================================================
// API Message Transformer
// =============================================================================

/** Transform API message to discriminated union */
export function transformApiMessage(msg: AgentMessage): ChatMessage {
  const base = {
    id: msg.id,
    role: msg.role,
    timestamp: new Date(msg.timestamp),
  };

  const metadata = msg.metadata ?? {};

  // Check for special message types in metadata
  if (metadata.message_type === 'approval_request') {
    return {
      ...base,
      kind: 'approval_request',
      content: msg.content,
      approval: {
        id: metadata.approval_id as string,
        type: metadata.approval_type as ApprovalType,
        title: metadata.title as string,
        summary: metadata.summary as string,
        status: (metadata.status as 'pending' | 'approved' | 'denied' | 'expired') ?? 'pending',
        expiresAt: metadata.expires_at as string | undefined,
        metadata: metadata.metadata as ApprovalRequestMessage['approval']['metadata'],
      },
    };
  }

  if (metadata.message_type === 'user_question') {
    return {
      ...base,
      kind: 'user_question',
      content: msg.content,
      question: {
        id: metadata.question_id as string,
        questions: metadata.questions as Question[],
        status: (metadata.status as 'pending' | 'answered' | 'expired') ?? 'pending',
        expiresAt: metadata.expires_at as string | undefined,
        answers: metadata.answers as Record<string, string> | undefined,
      },
    };
  }

  // Handle by API type field
  switch (msg.type) {
    case 'tool_call': {
      const toolName = metadata.tool_name as string;
      const isTask = toolName === 'Task';

      return {
        ...base,
        kind: 'tool_call',
        content: msg.content,
        tool: {
          name: toolName,
          id: metadata.tool_id as string,
          icon: metadata.icon as string | undefined,
          input: metadata.input as Record<string, unknown> | undefined,
        },
        parentToolUseId: metadata.parent_tool_use_id as string | undefined,
        subagent: isTask
          ? {
              type: metadata.subagent_type as string,
              runInBackground: (metadata.run_in_background as boolean) ?? false,
              taskId: metadata.task_id as string | undefined,
            }
          : undefined,
      };
    }

    case 'tool_result':
      return {
        ...base,
        kind: 'tool_result',
        content: msg.content,
        toolId: metadata.tool_id as string,
        isError: (metadata.is_error as boolean) ?? false,
        fullContent: metadata.full_content as string | undefined,
        status: metadata.status as 'running' | 'completed' | 'failed' | undefined,
        durationMs: metadata.duration_ms as number | undefined,
        costUsd: metadata.total_cost_usd as number | undefined,
      };

    case 'error':
      return {
        ...base,
        kind: 'error',
        content: msg.content,
      };

    default:
      // Check for sibyl_context (stored as metadata flag or content pattern)
      if (metadata.type === 'sibyl_context' || metadata.is_sibyl_context) {
        return {
          ...base,
          kind: 'sibyl_context',
          content: msg.content,
        };
      }

      return {
        ...base,
        kind: 'text',
        content: msg.content,
      };
  }
}

/** Transform array of API messages */
export function transformApiMessages(messages: AgentMessage[]): ChatMessage[] {
  return messages.map(transformApiMessage);
}

/** Create a pending message for optimistic UI */
export function createPendingMessage(content: string): PendingMessage {
  return {
    id: `pending-${Date.now()}`,
    kind: 'pending',
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

// =============================================================================
// Subagent Types
// =============================================================================

/** Subagent data for rendering nested agent execution */
export interface SubagentData {
  taskCall: ToolCallMessage;
  taskResult?: ToolResultMessage;
  nestedCalls: ToolCallMessage[];
  pollingCalls?: ToolCallMessage[];
  lastPollStatus?: 'running' | 'completed' | 'failed';
}

// =============================================================================
// Message Grouping Types
// =============================================================================

/** Grouped message types for rendering - discriminated union */
export type MessageGroup =
  | {
      kind: 'message';
      message: ChatMessage;
      pairedResult?: ToolResultMessage;
    }
  | {
      kind: 'subagent';
      taskCall: ToolCallMessage;
      taskResult?: ToolResultMessage;
      nestedCalls: ToolCallMessage[];
      resultsByToolId: Map<string, ToolResultMessage>;
      pollingCalls?: ToolCallMessage[];
    }
  | {
      kind: 'parallel_subagents';
      subagents: SubagentData[];
      resultsByToolId: Map<string, ToolResultMessage>;
    };

// =============================================================================
// Component Props Types
// =============================================================================

export interface ToolMessageProps {
  message: ToolCallMessage;
  result?: ToolResultMessage;
  isNew?: boolean;
  tier3Hint?: string;
}

export interface SubagentBlockProps {
  taskCall: ToolCallMessage;
  taskResult?: ToolResultMessage;
  nestedCalls: ToolCallMessage[];
  resultsByToolId: Map<string, ToolResultMessage>;
  pollingCalls?: ToolCallMessage[];
  /** When true, treat pending tasks as interrupted (parent agent terminated) */
  isAgentTerminal?: boolean;
}

export interface ParallelAgentsBlockProps {
  subagents: SubagentData[];
  resultsByToolId: Map<string, ToolResultMessage>;
  /** When true, treat pending tasks as interrupted (parent agent terminated) */
  isAgentTerminal?: boolean;
}

export interface ChatMessageComponentProps {
  message: ChatMessage;
  pairedResult?: ToolResultMessage;
  isNew?: boolean;
  statusHints?: Map<string, string>;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  pendingMessages: PendingMessage[];
  onSendMessage: (content: string) => void;
  onCancelPending: (id: string) => void;
  onEditPending: (id: string, newContent: string) => void;
  isAgentWorking: boolean;
  agentName: string;
  agentStatus: string;
  statusHints: Map<string, string>;
}
