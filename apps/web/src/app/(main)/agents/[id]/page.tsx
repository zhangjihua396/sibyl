'use client';

import { use } from 'react';
import { AgentChatPanel } from '@/components/agents/agent-chat-panel';
import { EntityBreadcrumb } from '@/components/layout/breadcrumb';
import { LoadingState } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/tooltip';
import { useAgent, useProjects } from '@/lib/hooks';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = use(params);
  const { data: agent, isLoading, error } = useAgent(id);
  const { data: projectsData } = useProjects();

  // Find parent project for breadcrumb
  const parentProject = agent?.project_id
    ? projectsData?.entities.find(p => p.id === agent.project_id)
    : undefined;

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EntityBreadcrumb entityType="agent" entityName="Error" />
        <ErrorState
          title="Failed to load agent"
          message={error instanceof Error ? error.message : 'Unknown error'}
        />
      </div>
    );
  }

  if (isLoading || !agent) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EntityBreadcrumb entityType="agent" entityName="Loading..." />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in -m-3 sm:-m-4 md:-m-6">
      {/* Breadcrumb - sticky at top */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-3 bg-sc-bg-dark">
        <EntityBreadcrumb
          entityType="agent"
          entityName={agent.name}
          parentProject={
            parentProject ? { id: parentProject.id, name: parentProject.name } : undefined
          }
        />
      </div>

      {/* Split Panel - Chat + Workspace - fills remaining space */}
      <div className="flex-1 min-h-0 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        <AgentChatPanel agent={agent} />
      </div>
    </div>
  );
}
