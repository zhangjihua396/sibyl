'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TaskPriority } from '@/lib/api';
import { TASK_PRIORITIES, TASK_PRIORITY_CONFIG } from '@/lib/constants';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    projectId?: string;
  }) => void;
  projects?: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  isSubmitting?: boolean;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  onSubmit,
  projects,
  defaultProjectId,
  isSubmitting,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setProjectId(defaultProjectId ?? '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, defaultProjectId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: projectId || undefined,
      });
    },
    [title, description, priority, projectId, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Cmd/Ctrl+Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [onClose, handleSubmit]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-sc-bg-dark/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-sc-bg-base border border-sc-fg-subtle/30 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sc-fg-subtle/20">
          <h2 className="text-lg font-semibold text-sc-fg-primary flex items-center gap-2">
            <span className="text-sc-purple">☰</span>
            Quick Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sc-fg-subtle hover:text-sc-fg-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-purple focus:outline-none focus:ring-2 focus:ring-sc-purple/10 transition-all"
              autoFocus
            />
          </div>

          {/* Description (optional) */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add description (optional)"
              rows={2}
              className="w-full px-3 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-purple focus:outline-none focus:ring-2 focus:ring-sc-purple/10 transition-all resize-none"
            />
          </div>

          {/* Project & Priority row */}
          <div className="flex gap-3">
            {/* Project select */}
            {projects && projects.length > 0 && (
              <div className="flex-1">
                <label className="block text-xs text-sc-fg-subtle mb-1">Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary focus:border-sc-purple focus:outline-none focus:ring-2 focus:ring-sc-purple/10 transition-all"
                >
                  <option value="">No project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority select */}
            <div className={projects && projects.length > 0 ? 'w-32' : 'flex-1'}>
              <label className="block text-xs text-sc-fg-subtle mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary focus:border-sc-purple focus:outline-none focus:ring-2 focus:ring-sc-purple/10 transition-all"
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_CONFIG[p]?.label ?? p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-sc-fg-subtle">
              <kbd className="bg-sc-bg-highlight px-1.5 py-0.5 rounded">⌘</kbd>
              <span className="mx-1">+</span>
              <kbd className="bg-sc-bg-highlight px-1.5 py-0.5 rounded">↵</kbd>
              <span className="ml-1">to submit</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sc-fg-muted hover:text-sc-fg-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-4 py-2 bg-sc-purple hover:bg-sc-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
