'use client';

import { FolderKanban, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/project-card';
import { ProjectDetail, ProjectDetailSkeleton } from '@/components/projects/project-detail';
import { ProjectsEmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/tooltip';
import type { TaskListResponse } from '@/lib/api';
import { useProjects, useTasks } from '@/lib/hooks';

interface ProjectsContentProps {
  initialProjects: TaskListResponse;
}

export function ProjectsContent({ initialProjects }: ProjectsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedProjectId = searchParams.get('id');

  // Hydrate from server data
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects(initialProjects);
  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    selectedProjectId ? { project: selectedProjectId } : undefined
  );

  const projects = projectsData?.entities ?? [];
  const tasks = tasksData?.entities ?? [];

  // Auto-select first project if none selected
  const effectiveSelectedId = selectedProjectId ?? projects[0]?.id ?? null;
  const selectedProject = projects.find(p => p.id === effectiveSelectedId);

  // Calculate task counts for each project
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; done: number; doing: number }> = {};
    // For now, we only have counts for the selected project
    if (selectedProjectId && tasks.length > 0) {
      counts[selectedProjectId] = {
        total: tasks.length,
        done: tasks.filter(t => t.metadata.status === 'done').length,
        doing: tasks.filter(t => t.metadata.status === 'doing').length,
      };
    }
    return counts;
  }, [selectedProjectId, tasks]);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('id', projectId);
      router.push(`/projects?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    ...(selectedProject ? [{ label: selectedProject.name }] : []),
  ];

  if (projectsError) {
    return (
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} custom />
        <PageHeader title="Projects" description="Manage your development projects" />
        <ErrorState
          title="Failed to load projects"
          message={projectsError instanceof Error ? projectsError.message : 'Unknown error'}
        />
      </div>
    );
  }

  // Empty state when no projects exist
  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbItems} custom />
        <PageHeader
          title="Projects"
          description="Manage your development projects"
          meta="0 projects"
        />
        <ProjectsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} custom />

      <PageHeader
        title="Projects"
        description="Manage your development projects"
        meta={`${projects.length} projects`}
        action={
          selectedProject && (
            <Link
              href={`/tasks?project=${selectedProject.id}`}
              className="px-4 py-2 bg-sc-cyan/20 hover:bg-sc-cyan/30 text-sc-cyan border border-sc-cyan/30 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>☰</span>
              <span>View Tasks</span>
            </Link>
          )
        }
      />

      <div className="flex gap-6">
        {/* Sidebar - Project List */}
        <div className="w-72 shrink-0">
          <div className="sticky top-4 space-y-2">
            <h2 className="text-sm font-semibold text-sc-fg-muted px-1 mb-3">All Projects</h2>

            {projectsLoading ? (
              <div className="space-y-2">
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
                <ProjectCardSkeleton />
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={project.id === effectiveSelectedId}
                    onClick={() => handleSelectProject(project.id)}
                    taskCounts={projectTaskCounts[project.id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Project Detail */}
        <div className="flex-1 min-w-0">
          {projectsLoading || tasksLoading ? (
            <ProjectDetailSkeleton />
          ) : !selectedProject ? (
            <div className="flex items-center justify-center h-64 text-sc-fg-subtle">
              <div className="text-center">
                <div className="text-4xl mb-4">◇</div>
                <p>Select a project from the sidebar to view details</p>
              </div>
            </div>
          ) : (
            <ProjectDetail project={selectedProject} tasks={tasks} />
          )}
        </div>
      </div>
    </div>
  );
}
