'use client';

/**
 * Agent Chat Panel - Main entry point for agent chat interface.
 *
 * This is a thin orchestrator that composes the chat components.
 * All logic is delegated to specialized modules:
 * - chat-panel.tsx: Main chat container
 * - chat-header.tsx: Agent header with controls
 * - chat-messages.tsx: Message rendering
 * - chat-tool-message.tsx: Tool call display
 * - chat-subagent.tsx: Subagent execution blocks
 * - chat-states.tsx: Loading and empty states
 * - chat-grouping.ts: Message grouping logic
 * - chat-types.ts: Shared types
 * - chat-constants.ts: Constants and helpers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Agent } from '@/lib/api';
import {
  useAgentMessages,
  useAgentSubscription,
  useSendAgentMessage,
  useStatusHints,
} from '@/lib/hooks';
import { AgentHeader } from './chat-header';
import { ChatPanel } from './chat-panel';
import { createPendingMessage, type PendingMessage, transformApiMessages } from './chat-types';

// Heartbeat threshold (matching backend)
const STALE_THRESHOLD_SECONDS = 120;

/** Check if agent is a zombie (says working but no heartbeat) */
function isAgentZombie(agent: {
  status: string;
  last_heartbeat: string | null;
  started_at: string | null;
}): boolean {
  // waiting_approval is expected to not heartbeat - worker is blocked on Redis
  // Only check for zombies on actively running states
  const isSupposedlyActive = ['initializing', 'working', 'resuming'].includes(agent.status);
  if (!isSupposedlyActive) return false;

  // Grace period for new agents that haven't heartbeated yet
  if (!agent.last_heartbeat) {
    // If started recently (within grace period), not a zombie yet
    if (agent.started_at) {
      const startedAt = new Date(agent.started_at);
      const secondsSinceStart = (Date.now() - startedAt.getTime()) / 1000;
      if (secondsSinceStart < STALE_THRESHOLD_SECONDS) return false;
    }
    // Never heartbeated and no start time or past grace period
    return true;
  }

  const lastHeartbeat = new Date(agent.last_heartbeat);
  const secondsSince = (Date.now() - lastHeartbeat.getTime()) / 1000;
  return secondsSince > STALE_THRESHOLD_SECONDS;
}

// =============================================================================
// AgentChatPanel
// =============================================================================

export interface AgentChatPanelProps {
  agent: Agent;
}

/** Main agent chat interface - orchestrates hooks and composes components */
export function AgentChatPanel({ agent }: AgentChatPanelProps) {
  // Subscribe to real-time updates via WebSocket
  useAgentSubscription(agent.id);

  // Fetch messages from API (WebSocket will invalidate on updates)
  const { data: messagesData } = useAgentMessages(agent.id);
  const sendMessage = useSendAgentMessage();

  // Tier 3 status hints from Haiku (via WebSocket)
  const statusHints = useStatusHints(agent.id);

  // Check if agent is actively working (excluding zombies)
  const isZombie = isAgentZombie(agent);
  const isAgentWorking =
    ['initializing', 'working', 'resuming'].includes(agent.status) && !isZombie;

  // Track pending messages (queued but not yet processed by agent)
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const lastMessageCount = useRef(0);

  // Transform API messages to discriminated union types
  const messages = useMemo(() => {
    if (!messagesData?.messages) return [];
    return transformApiMessages(messagesData.messages);
  }, [messagesData?.messages]);

  // Remove pending messages when they appear in server response
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      // New messages arrived - check if any pending messages were delivered
      const newMessages = messages.slice(lastMessageCount.current);
      const deliveredContent = new Set(
        newMessages.filter(m => m.role === 'user').map(m => m.content.trim())
      );

      if (deliveredContent.size > 0) {
        setPendingMessages(prev => prev.filter(p => !deliveredContent.has(p.content.trim())));
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages]);

  const handleSendMessage = useCallback(
    (content: string) => {
      // Add to pending queue immediately for instant feedback
      setPendingMessages(prev => [...prev, createPendingMessage(content)]);

      // Send to server
      sendMessage.mutate({ id: agent.id, content });
    },
    [agent.id, sendMessage]
  );

  const handleCancelPending = useCallback((id: string) => {
    setPendingMessages(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleEditPending = useCallback((id: string, newContent: string) => {
    setPendingMessages(prev => prev.map(p => (p.id === id ? { ...p, content: newContent } : p)));
  }, []);

  return (
    <div className="h-full flex flex-col bg-sc-bg-base rounded-lg border border-sc-fg-subtle/20 overflow-hidden shadow-xl shadow-sc-purple/5">
      <AgentHeader agent={agent} />
      <ChatPanel
        messages={messages}
        pendingMessages={pendingMessages}
        onSendMessage={handleSendMessage}
        onCancelPending={handleCancelPending}
        onEditPending={handleEditPending}
        isAgentWorking={isAgentWorking}
        agentName={agent.name}
        agentStatus={agent.status}
        statusHints={statusHints}
      />
    </div>
  );
}
