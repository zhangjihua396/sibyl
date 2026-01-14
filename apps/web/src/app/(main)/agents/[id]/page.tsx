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
        <EntityBreadcrumb entityType="agent" entityName="错误" />
        <ErrorState
          title="加载代理失败"
          message={error instanceof Error ? error.message : 'Unknown error'}
        />
      </div>
    );
  }

  if (isLoading || !agent) {
    return (
      <div className="space-y-4 animate-fade-in">
        <EntityBreadcrumb entityType="agent" entityName="加载中..." />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in overflow-hidden">
      {/* Breadcrumb - fixed at top */}
      <div className="shrink-0 pb-3">
        <EntityBreadcrumb
          entityType="agent"
          entityName={agent.name}
          parentProject={
            parentProject ? { id: parentProject.id, name: parentProject.name } : undefined
          }
        />
      </div>

      {/* Chat Panel - fills remaining space, handles its own scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AgentChatPanel agent={agent} />
      </div>
    </div>
  );
}
