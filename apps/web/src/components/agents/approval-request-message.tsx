'use client';

/**
 * ApprovalRequestMessage - Inline approval request in agent chat.
 *
 * Compact version of approval UI that appears in the chat thread when
 * an agent requests human approval for a dangerous operation.
 */

import { formatDistanceToNow } from 'date-fns';
import { memo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Check,
  Clock,
  Code,
  InfoCircle,
  WarningCircle,
  Xmark,
} from '@/components/ui/icons';
import { Markdown } from '@/components/ui/markdown';
import { Spinner } from '@/components/ui/spinner';
import type { ApprovalType } from '@/lib/api';
import { useRespondToApproval } from '@/lib/hooks';

// Type config matches approval-queue.tsx
const TYPE_CONFIG: Record<ApprovalType, { icon: typeof Code; label: string; colorClass: string }> =
  {
    destructive_command: {
      icon: AlertTriangle,
      label: 'Destructive Command',
      colorClass: 'text-sc-red',
    },
    sensitive_file: {
      icon: WarningCircle,
      label: 'Sensitive File',
      colorClass: 'text-sc-yellow',
    },
    external_api: {
      icon: Code,
      label: 'External API',
      colorClass: 'text-sc-cyan',
    },
    cost_threshold: {
      icon: AlertTriangle,
      label: 'Cost Threshold',
      colorClass: 'text-sc-yellow',
    },
    review_phase: {
      icon: Check,
      label: 'Review Phase',
      colorClass: 'text-sc-purple',
    },
    question: {
      icon: InfoCircle,
      label: 'Question',
      colorClass: 'text-sc-cyan',
    },
    scope_change: {
      icon: AlertTriangle,
      label: 'Scope Change',
      colorClass: 'text-sc-yellow',
    },
    merge_conflict: {
      icon: WarningCircle,
      label: 'Merge Conflict',
      colorClass: 'text-sc-red',
    },
    test_failure: {
      icon: WarningCircle,
      label: 'Test Failure',
      colorClass: 'text-sc-red',
    },
  };

export interface ApprovalRequestMessageProps {
  approvalId: string;
  approvalType: ApprovalType;
  title: string;
  summary: string;
  metadata?: {
    command?: string;
    file_path?: string;
    url?: string;
    pattern_matched?: string;
  };
  expiresAt?: string;
  status?: 'pending' | 'approved' | 'denied' | 'expired';
}

export const ApprovalRequestMessage = memo(function ApprovalRequestMessage({
  approvalId,
  approvalType,
  title,
  summary,
  metadata,
  expiresAt,
  status = 'pending',
}: ApprovalRequestMessageProps) {
  const respondMutation = useRespondToApproval();
  const [isExpanded, setIsExpanded] = useState(true);

  const typeConfig = TYPE_CONFIG[approvalType] || {
    icon: InfoCircle,
    label: approvalType,
    colorClass: 'text-sc-fg-muted',
  };
  const TypeIcon = typeConfig.icon;

  const handleAction = (action: 'approve' | 'deny') => {
    respondMutation.mutate({
      id: approvalId,
      request: { action },
    });
  };

  const isPending = status === 'pending';
  const isExpiredTime = expiresAt && new Date(expiresAt) < new Date();
  const isResolved = !isPending || isExpiredTime;

  // Border/background colors based on status
  const statusStyles = isPending
    ? 'border-sc-yellow/50 bg-sc-yellow/5'
    : status === 'approved'
      ? 'border-sc-green/30 bg-sc-green/5'
      : 'border-sc-red/30 bg-sc-red/5';

  return (
    <div className={`rounded-lg border p-3 transition-all duration-200 ${statusStyles}`}>
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center gap-2 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TypeIcon className={`h-4 w-4 flex-shrink-0 ${typeConfig.colorClass}`} />
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${typeConfig.colorClass} bg-current/10`}
        >
          {typeConfig.label}
        </span>
        <span className="text-sm font-medium text-sc-fg-primary truncate flex-1">{title}</span>
        {/* Status indicator */}
        {isResolved && (
          <span
            className={`text-xs flex items-center gap-1 ${
              status === 'approved' ? 'text-sc-green' : 'text-sc-red'
            }`}
          >
            {status === 'approved' && (
              <>
                <Check className="h-3 w-3" /> Approved
              </>
            )}
            {status === 'denied' && (
              <>
                <Xmark className="h-3 w-3" /> Denied
              </>
            )}
            {isExpiredTime && status === 'pending' && (
              <>
                <Clock className="h-3 w-3" /> Expired
              </>
            )}
          </span>
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Summary with markdown */}
          <div className="text-sm text-sc-fg-muted">
            <Markdown content={summary} />
          </div>

          {/* Metadata (command, file path, URL) */}
          {metadata && (metadata.command || metadata.file_path || metadata.url) && (
            <div className="p-2 bg-sc-bg-dark rounded text-xs font-mono space-y-1">
              {metadata.command && (
                <div className="text-sc-purple">
                  <span className="text-sc-fg-subtle">$</span> {metadata.command}
                </div>
              )}
              {metadata.file_path && (
                <div className="text-sc-cyan">
                  <span className="text-sc-fg-subtle">File:</span> {metadata.file_path}
                </div>
              )}
              {metadata.url && (
                <div className="text-sc-cyan">
                  <span className="text-sc-fg-subtle">URL:</span> {metadata.url}
                </div>
              )}
            </div>
          )}

          {/* Actions for pending approvals */}
          {isPending && !isExpiredTime && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAction('approve')}
                disabled={respondMutation.isPending}
                className="flex-1 bg-sc-green hover:bg-sc-green/80"
              >
                {respondMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleAction('deny')}
                disabled={respondMutation.isPending}
                className="flex-1"
              >
                {respondMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <Xmark className="h-4 w-4 mr-1" />
                )}
                Deny
              </Button>
            </div>
          )}

          {/* Expiry countdown for pending */}
          {isPending && expiresAt && !isExpiredTime && (
            <div className="flex items-center gap-1 text-xs text-sc-fg-subtle">
              <Clock className="h-3 w-3" />
              Expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
