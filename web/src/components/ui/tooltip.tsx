'use client';

import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrows = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-sc-bg-elevated',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-sc-bg-elevated',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-sc-bg-elevated',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-sc-bg-elevated',
};

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setVisible(false);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 px-2 py-1 text-xs text-sc-fg-primary
            bg-sc-bg-elevated border border-sc-fg-subtle/20 rounded-lg shadow-lg
            whitespace-nowrap animate-fade-in
            ${positions[position]}
          `}
          role="tooltip"
        >
          {content}
          <span
            className={`absolute w-0 h-0 border-4 ${arrows[position]}`}
          />
        </div>
      )}
    </div>
  );
}

// Empty state component for when there's no data
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      {icon && (
        <div className="text-6xl mb-4 opacity-60">{icon}</div>
      )}
      <p className="text-sc-fg-muted text-lg font-medium">{title}</p>
      {description && (
        <p className="text-sc-fg-subtle text-sm mt-2 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({ title = 'Something went wrong', message, action }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">⚠</div>
      <p className="text-sc-red text-lg font-medium">{title}</p>
      <p className="text-sc-fg-muted text-sm mt-1">{message}</p>
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
