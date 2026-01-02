'use client';

/**
 * Chat message rendering component.
 *
 * Uses exhaustive switch matching on message kind for type-safe dispatch.
 */

import { Markdown } from '@/components/ui/markdown';
import { ApprovalRequestMessage } from './approval-request-message';
import { MessageErrorBoundary } from './chat-error-boundary';
import { ToolMessage } from './chat-tool-message';
import type {
  ChatMessage,
  ChatMessageComponentProps,
  ToolCallMessage,
  ToolResultMessage,
} from './chat-types';
import { SibylContextMessage } from './sibyl-context-message';
import { UserQuestionMessage } from './user-question-message';

// =============================================================================
// Exhaustive Check Helper
// =============================================================================

/** Ensures all cases are handled in switch statements */
function assertNever(x: never): never {
  throw new Error(`Unhandled message kind: ${(x as ChatMessage).kind}`);
}

// =============================================================================
// ChatMessageComponent
// =============================================================================

/** Renders individual chat messages based on discriminated union kind */
export function ChatMessageComponent({
  message,
  pairedResult,
  isNew = false,
  statusHints,
}: ChatMessageComponentProps) {
  // Use exhaustive switch for type-safe dispatch
  switch (message.kind) {
    case 'sibyl_context':
      return (
        <MessageErrorBoundary messageId={`sibyl-${message.timestamp.getTime()}`}>
          <SibylContextMessage
            content={message.content}
            timestamp={message.timestamp}
            isNew={isNew}
          />
        </MessageErrorBoundary>
      );

    case 'approval_request':
      return (
        <MessageErrorBoundary messageId={message.approval.id}>
          <div className={`my-2 ${isNew ? 'animate-slide-up' : ''}`}>
            <ApprovalRequestMessage
              approvalId={message.approval.id}
              approvalType={message.approval.type}
              title={message.approval.title}
              summary={message.approval.summary}
              metadata={message.approval.metadata}
              expiresAt={message.approval.expiresAt}
              status={message.approval.status}
            />
          </div>
        </MessageErrorBoundary>
      );

    case 'user_question':
      return (
        <MessageErrorBoundary messageId={message.question.id}>
          <div className={`my-2 ${isNew ? 'animate-slide-up' : ''}`}>
            <UserQuestionMessage
              questionId={message.question.id}
              questions={message.question.questions}
              expiresAt={message.question.expiresAt}
              status={message.question.status}
              answers={message.question.answers}
            />
          </div>
        </MessageErrorBoundary>
      );

    case 'tool_call': {
      const tier3Hint = statusHints?.get(message.tool.id);
      return (
        <MessageErrorBoundary messageId={message.tool.id}>
          <ToolMessage
            message={message as ToolCallMessage}
            result={pairedResult as ToolResultMessage | undefined}
            isNew={isNew}
            tier3Hint={tier3Hint}
          />
        </MessageErrorBoundary>
      );
    }

    case 'tool_result':
      // Tool results are rendered paired with their tool calls, not standalone
      return null;

    case 'error':
      return (
        <div className={`text-center py-2 ${isNew ? 'animate-fade-in' : ''}`}>
          <span className="text-xs text-sc-red bg-sc-red/10 px-2 py-1 rounded">
            {message.content}
          </span>
        </div>
      );

    case 'pending':
      // Pending messages rendered in ChatPanel with special styling
      return (
        <div className={`flex gap-2 flex-row-reverse ${isNew ? 'animate-slide-up' : ''}`}>
          <div className="max-w-[85%] rounded-lg px-3 py-2 bg-gradient-to-br from-sc-yellow/15 to-sc-yellow/5 border border-sc-yellow/30 shadow-lg shadow-sc-yellow/10">
            <p className="text-sm text-sc-fg-primary whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
            <p className="text-[10px] text-sc-fg-muted mt-1 tabular-nums">Queued...</p>
          </div>
        </div>
      );

    case 'text':
      // Dispatch based on role for text messages
      if (message.role === 'system') {
        return (
          <div className={`text-center py-1 ${isNew ? 'animate-fade-in' : ''}`}>
            <span className="text-xs text-sc-fg-subtle">{message.content}</span>
          </div>
        );
      }

      if (message.role === 'agent') {
        return (
          <MessageErrorBoundary messageId={`agent-${message.timestamp.getTime()}`}>
            <div
              className={`rounded-lg bg-gradient-to-br from-sc-purple/5 via-sc-bg-elevated to-sc-cyan/5 border border-sc-purple/20 p-4 my-2 shadow-lg shadow-sc-purple/5 ${isNew ? 'animate-slide-up' : ''}`}
            >
              <Markdown content={message.content} className="text-sm" />
              <p className="text-[10px] text-sc-fg-subtle mt-3 tabular-nums border-t border-sc-fg-subtle/10 pt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </MessageErrorBoundary>
        );
      }

      // User text message
      return (
        <div className={`flex gap-2 flex-row-reverse ${isNew ? 'animate-slide-up' : ''}`}>
          <div className="max-w-[85%] rounded-lg px-3 py-2 bg-gradient-to-br from-sc-cyan/15 to-sc-cyan/5 border border-sc-cyan/30 shadow-lg shadow-sc-cyan/10">
            <p className="text-sm text-sc-fg-primary whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
            <p className="text-[10px] text-sc-fg-muted mt-1 tabular-nums">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );

    default:
      // Exhaustive check - TypeScript will error if a case is missing
      return assertNever(message);
  }
}
