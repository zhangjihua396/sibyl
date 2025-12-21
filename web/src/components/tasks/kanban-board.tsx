'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import type { TaskStatus, TaskSummary } from '@/lib/api';
import { TASK_STATUS_CONFIG, TASK_STATUSES } from '@/lib/constants';
import { TaskCard, TaskCardSkeleton } from './task-card';

interface KanbanBoardProps {
  tasks: TaskSummary[];
  projects?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick?: (taskId: string) => void;
  onProjectFilter?: (projectId: string) => void;
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskSummary[];
  projectMap: Map<string, string>;
  onDrop: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (taskId: string) => void;
  onProjectClick?: (projectId: string) => void;
  dragOverStatus: TaskStatus | null;
  onDragOver: (status: TaskStatus) => void;
  onDragLeave: () => void;
}

const KanbanColumn = memo(function KanbanColumn({
  status,
  tasks,
  projectMap,
  onDrop,
  onTaskClick,
  onProjectClick,
  dragOverStatus,
  onDragOver,
  onDragLeave,
}: KanbanColumnProps) {
  const config = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG];
  const isDragOver = dragOverStatus === status;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(status);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDrop(taskId, status);
    }
    onDragLeave();
  };

  return (
    <div
      className="flex-1 min-w-[280px] max-w-[360px]"
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`text-lg ${config?.textClass}`}>{config?.icon}</span>
        <h3 className="text-sm font-semibold text-sc-fg-primary">{config?.label}</h3>
        <span className="text-xs text-sc-fg-muted bg-sc-bg-elevated px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Column content */}
      <div
        className={`
          min-h-[200px] p-2 rounded-xl
          bg-sc-bg-highlight/30 border-2 border-dashed
          transition-all duration-200
          ${isDragOver ? 'border-sc-purple/50 bg-sc-purple/5' : 'border-transparent'}
        `}
      >
        <div className="space-y-2">
          {tasks.map(task => {
            const projectId = task.metadata.project_id as string | undefined;
            const projectName = projectId ? projectMap.get(projectId) : undefined;

            return (
              <TaskCard
                key={task.id}
                task={task}
                projectName={projectName}
                onDragStart={(e, id) => {
                  e.dataTransfer.setData('text/plain', id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={onTaskClick}
                onProjectClick={onProjectClick}
              />
            );
          })}
        </div>

        {tasks.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-24 text-sc-fg-subtle text-sm">
            No tasks
          </div>
        )}

        {isDragOver && (
          <div className="flex items-center justify-center h-12 mt-2 border-2 border-dashed border-sc-purple/30 rounded-lg text-sc-purple text-sm">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
});

export function KanbanBoard({
  tasks,
  projects,
  isLoading,
  onStatusChange,
  onTaskClick,
  onProjectFilter,
}: KanbanBoardProps) {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Build project lookup map
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects ?? []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projects]);

  // Group tasks by status - memoized to prevent recalculation on every render
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskSummary[]> = {
      backlog: [],
      todo: [],
      doing: [],
      blocked: [],
      review: [],
      done: [],
      archived: [],
    };

    for (const task of tasks) {
      const status = (task.metadata.status ?? 'todo') as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    }

    return grouped;
  }, [tasks]);

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    onStatusChange?.(taskId, newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map(status => (
          <div key={status} className="flex-1 min-w-[280px] max-w-[360px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-5 h-5 bg-sc-bg-elevated rounded animate-pulse" />
              <div className="w-16 h-4 bg-sc-bg-elevated rounded animate-pulse" />
            </div>
            <div className="p-2 rounded-xl bg-sc-bg-highlight/30 space-y-2">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUSES.map(status => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status] || []}
          projectMap={projectMap}
          onDrop={handleDrop}
          onTaskClick={onTaskClick}
          onProjectClick={onProjectFilter}
          dragOverStatus={dragOverStatus}
          onDragOver={setDragOverStatus}
          onDragLeave={() => setDragOverStatus(null)}
        />
      ))}
    </div>
  );
}
