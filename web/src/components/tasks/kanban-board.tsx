'use client';

import { useState, useCallback } from 'react';
import type { TaskStatus, TaskSummary } from '@/lib/api';
import { TASK_STATUS_CONFIG, TASK_STATUSES } from '@/lib/constants';
import { TaskCard, TaskCardSkeleton } from './task-card';

interface KanbanBoardProps {
  tasks: TaskSummary[];
  isLoading?: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick?: (taskId: string) => void;
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskSummary[];
  onDrop: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (taskId: string) => void;
  dragOverStatus: TaskStatus | null;
  onDragOver: (status: TaskStatus) => void;
  onDragLeave: () => void;
}

function KanbanColumn({
  status,
  tasks,
  onDrop,
  onTaskClick,
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={(e, id) => {
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onClick={onTaskClick}
            />
          ))}
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
}

export function KanbanBoard({ tasks, isLoading, onStatusChange, onTaskClick }: KanbanBoardProps) {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Group tasks by status
  const tasksByStatus = useCallback(() => {
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
  }, [tasks])();

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    onStatusChange?.(taskId, newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
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
      {TASK_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status] || []}
          onDrop={handleDrop}
          onTaskClick={onTaskClick}
          dragOverStatus={dragOverStatus}
          onDragOver={setDragOverStatus}
          onDragLeave={() => setDragOverStatus(null)}
        />
      ))}
    </div>
  );
}
