'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

import { KnowledgeGraph } from '@/components/graph/knowledge-graph';
import { useStats } from '@/lib/hooks';

function GraphControls({
  onFilterChange,
  filters,
}: {
  onFilterChange: (filters: { types?: string[] }) => void;
  filters: { types?: string[] };
}) {
  const { data: stats } = useStats();
  const entityTypes = stats ? Object.keys(stats.entity_counts) : [];

  const toggleType = (type: string) => {
    const current = filters.types || [];
    const newTypes = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    onFilterChange({ types: newTypes.length > 0 ? newTypes : undefined });
  };

  return (
    <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-lg p-4">
      <h3 className="text-sm font-medium text-sc-fg-muted mb-3">Entity Types</h3>
      <div className="flex flex-wrap gap-2">
        {entityTypes.map(type => {
          const isActive = !filters.types || filters.types.includes(type);
          return (
            <button
              type="button"
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                isActive
                  ? 'bg-sc-purple/20 text-sc-purple border border-sc-purple/30'
                  : 'bg-sc-bg-highlight text-sc-fg-subtle border border-sc-fg-subtle/10 hover:border-sc-fg-subtle/30'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GraphPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedNodeId = searchParams.get('selected');

  const [filters, setFilters] = useState<{ types?: string[] }>({});

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams);
      if (nodeId === selectedNodeId) {
        params.delete('selected');
      } else {
        params.set('selected', nodeId);
      }
      router.push(`/graph?${params.toString()}`);
    },
    [router, searchParams, selectedNodeId]
  );

  const handleViewEntity = useCallback(() => {
    if (selectedNodeId) {
      router.push(`/entities/${selectedNodeId}`);
    }
  }, [router, selectedNodeId]);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sc-fg-primary">Knowledge Graph</h1>
          <p className="text-sc-fg-muted">Explore entity relationships and patterns</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedNodeId && (
            <button
              type="button"
              onClick={handleViewEntity}
              className="px-4 py-2 bg-sc-cyan/20 text-sc-cyan rounded-lg hover:bg-sc-cyan/30 transition-colors"
            >
              View Entity
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <GraphControls filters={filters} onFilterChange={setFilters} />

      {/* Graph */}
      <div className="flex-1 bg-sc-bg-dark rounded-xl border border-sc-fg-subtle/20 overflow-hidden">
        <KnowledgeGraph
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNodeId}
          maxNodes={500}
        />
      </div>

      {/* Legend */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e135ff]" />
            <span className="text-sc-fg-muted">Pattern</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff6363]" />
            <span className="text-sc-fg-muted">Rule</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#80ffea]" />
            <span className="text-sc-fg-muted">Template</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f1fa8c]" />
            <span className="text-sc-fg-muted">Tool</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff6ac1]" />
            <span className="text-sc-fg-muted">Language</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#50fa7b]" />
            <span className="text-sc-fg-muted">Episode</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GraphPageContent />
    </Suspense>
  );
}
