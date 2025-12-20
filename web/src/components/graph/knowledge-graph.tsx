'use client';

import { darkTheme, GraphCanvas, type GraphEdge, type GraphNode } from 'reagraph';

import { useGraphData } from '@/lib/hooks';

/**
 * SilkCircuit color palette for entity types.
 */
const entityColors: Record<string, string> = {
  pattern: '#e135ff', // Electric Purple
  rule: '#ff6363', // Error Red
  template: '#80ffea', // Neon Cyan
  tool: '#f1fa8c', // Electric Yellow
  language: '#ff6ac1', // Coral
  topic: '#ff00ff', // Pure Magenta
  episode: '#50fa7b', // Success Green
  knowledge_source: '#8b85a0', // Muted
  config_file: '#f1fa8c',
  slash_command: '#80ffea',
};

const defaultNodeColor = '#8b85a0';

interface KnowledgeGraphProps {
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  maxNodes?: number;
}

export function KnowledgeGraph({
  onNodeClick,
  selectedNodeId,
  maxNodes = 500,
}: KnowledgeGraphProps) {
  const { data, isLoading, error } = useGraphData({ max_nodes: maxNodes, max_edges: 1000 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-sc-bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sc-fg-muted">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-sc-bg-dark">
        <div className="text-center">
          <p className="text-sc-red text-lg mb-2">Failed to load graph</p>
          <p className="text-sc-fg-muted text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-sc-bg-dark">
        <div className="text-center">
          <p className="text-sc-fg-muted text-lg mb-2">No entities in the knowledge graph</p>
          <p className="text-sc-fg-subtle text-sm">
            Try ingesting some documents to populate the graph
          </p>
        </div>
      </div>
    );
  }

  // Transform API data to Reagraph format
  const nodes: GraphNode[] = data.nodes.map(node => ({
    id: node.id,
    label: node.label,
    fill: node.color || entityColors[node.type] || defaultNodeColor,
    size: Math.max(10, Math.min(40, node.size * 5)),
    data: { type: node.type },
  }));

  const edges: GraphEdge[] = data.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.type,
    size: Math.max(1, edge.weight * 2),
  }));

  return (
    <div className="w-full h-full">
      <GraphCanvas
        nodes={nodes}
        edges={edges}
        cameraMode="rotate"
        layoutType="forceDirected2d"
        draggable
        animated
        theme={darkTheme}
        labelType="all"
        edgeArrowPosition="end"
        sizingType="attribute"
        sizingAttribute="size"
        selections={selectedNodeId ? [selectedNodeId] : []}
        onNodeClick={node => {
          onNodeClick?.(node.id);
        }}
      />
    </div>
  );
}
