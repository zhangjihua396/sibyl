import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProjectsSkeleton } from '@/components/suspense-boundary';
import { fetchProjects } from '@/lib/api-server';
import { ProjectsContent } from './projects-content';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your Sibyl projects',
};

export default async function ProjectsPage() {
  const projects = await fetchProjects();

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent initialProjects={projects} />
    </Suspense>
  );
}
