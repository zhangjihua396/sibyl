'use client';

/**
 * Sibyl context injection message component.
 *
 * Shows what context was injected from Sibyl's knowledge graph
 * into the agent's conversation. Collapsible for cleaner threads.
 */

import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/components/ui/markdown';

interface SibylContextMessageProps {
  content: string;
  timestamp: Date;
  isNew?: boolean;
}

export function SibylContextMessage({
  content,
  timestamp,
  isNew = false,
}: SibylContextMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`my-2 rounded-lg border border-sc-yellow/30 bg-gradient-to-br from-sc-yellow/5 via-sc-bg-elevated to-sc-yellow/10 shadow-sm ${isNew ? 'animate-fade-in' : ''}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sc-yellow/5 transition-colors rounded-lg"
      >
        <Sparkles className="h-4 w-4 text-sc-yellow shrink-0" />
        <span className="text-xs font-medium text-sc-yellow">Sibyl Context Injected</span>
        <span className="text-[10px] text-sc-fg-muted ml-auto mr-2 tabular-nums">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-sc-fg-muted shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-sc-fg-muted shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-sc-yellow/20">
          <div className="text-xs text-sc-fg-muted mb-2">
            The following knowledge was provided to the agent:
          </div>
          <div className="rounded bg-sc-bg-primary/50 p-2 border border-sc-yellow/10">
            <Markdown content={content} className="text-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
