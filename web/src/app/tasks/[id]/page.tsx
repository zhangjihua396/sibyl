'use client';

import { useRouter } from 'next/navigation';
import { use, useMemo } from 'react';
import { EntityBreadcrumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { TaskDetailPanel, TaskDetailSkeleton } from '@/components/tasks';
import { ErrorState } from '@/components/ui/tooltip';
import type { TaskPriorityType, TaskStatusType } from '@/lib/constants';
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/lib/constants';
import { useProjects, useRelatedEntities, useTask } from '@/lib/hooks';

interface RelatedEntity {
  id: string;
  type: string;
  name: string;
  relationship?: string;
}

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: task, isLoading, error } = useTask(id);
  const { data: relatedData } = useRelatedEntities(id);
  const { data: projectsData } = useProjects();

  // Find parent project for breadcrumb
  const parentProject = useMemo(() => {
    const projectId = task?.metadata?.project_id as string | undefined;
    if (!projectId || !projectsData?.entities) return undefined;
    const project = projectsData.entities.find(p => p.id === projectId);
    return project ? { id: project.id, name: project.name } : undefined;
  }, [task, projectsData]);

  // Transform related entities for display
  const entities = (relatedData?.entities || []) as RelatedEntity[];
  const relatedKnowledge = entities
    .filter(e => ['pattern', 'rule', 'template', 'topic'].includes(e.type))
    .map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      relationship: e.relationship || 'Related',
    }));

  // Get status/priority for header meta
  const status = (task?.metadata?.status as TaskStatusType) || 'backlog';
  const priority = (task?.metadata?.priority as TaskPriorityType) || 'medium';
  const statusConfig = TASK_STATUS_CONFIG[status];
  const priorityConfig = TASK_PRIORITY_CONFIG[priority];

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EntityBreadcrumb entityType="task" entityName="Error" />
        <PageHeader title="Task Details" />
        <ErrorState
          title="Failed to load task"
          message={error instanceof Error ? error.message : 'Unknown error'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Fluid breadcrumb navigation */}
      <EntityBreadcrumb
        entityType="task"
        entityName={task?.name || 'Loading...'}
        parentProject={parentProject}
      />

      <PageHeader
        title={task?.name || 'Loading...'}
        description={task?.description}
        meta={
          task
            ? `${statusConfig.icon} ${statusConfig.label} · ${priorityConfig.label} priority`
            : undefined
        }
        action={
          parentProject && (
            <button
              type="button"
              onClick={() => router.push(`/tasks?project=${parentProject.id}`)}
              className="px-4 py-2 bg-sc-cyan/20 hover:bg-sc-cyan/30 text-sc-cyan border border-sc-cyan/30 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <span>◇</span>
              <span>View {parentProject.name} Tasks</span>
            </button>
          )
        }
      />

      {isLoading || !task ? (
        <TaskDetailSkeleton />
      ) : (
        <TaskDetailPanel task={task} relatedKnowledge={relatedKnowledge} />
      )}
    </div>
  );
}
