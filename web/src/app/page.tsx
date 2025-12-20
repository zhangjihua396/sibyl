'use client';

import { useHealth, useStats } from '@/lib/hooks';

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useHealth();
  const { data: stats, isLoading: statsLoading } = useStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sc-fg-primary">Dashboard</h1>
        <p className="text-sc-fg-muted">Knowledge graph overview and server status</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-sc-fg-muted">Server Status</h3>
            <span
              className={`w-3 h-3 rounded-full ${
                health?.status === 'healthy'
                  ? 'bg-sc-green animate-pulse'
                  : health?.status === 'unhealthy'
                    ? 'bg-sc-red'
                    : 'bg-sc-yellow animate-pulse'
              }`}
            />
          </div>
          <p className="text-2xl font-bold text-sc-fg-primary">
            {healthLoading ? '...' : health?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
          </p>
          <p className="text-sm text-sc-fg-subtle mt-1">
            {health?.graph_connected ? 'Graph connected' : 'Graph disconnected'}
          </p>
        </div>

        {/* Total Entities */}
        <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-sc-fg-muted">Total Entities</h3>
            <span className="text-sc-purple">▣</span>
          </div>
          <p className="text-2xl font-bold text-sc-fg-primary">
            {statsLoading ? '...' : (stats?.total_entities ?? 0)}
          </p>
          <p className="text-sm text-sc-fg-subtle mt-1">Across all types</p>
        </div>

        {/* Uptime */}
        <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-sc-fg-muted">Uptime</h3>
            <span className="text-sc-cyan">↑</span>
          </div>
          <p className="text-2xl font-bold text-sc-fg-primary">
            {healthLoading ? '...' : formatUptime(health?.uptime_seconds ?? 0)}
          </p>
          <p className="text-sm text-sc-fg-subtle mt-1">{health?.server_name ?? 'sibyl'}</p>
        </div>

        {/* Patterns */}
        <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-sc-fg-muted">Patterns</h3>
            <span className="text-sc-purple">◆</span>
          </div>
          <p className="text-2xl font-bold text-sc-fg-primary">
            {statsLoading ? '...' : (stats?.entity_counts?.pattern ?? 0)}
          </p>
          <p className="text-sm text-sc-fg-subtle mt-1">Development patterns</p>
        </div>
      </div>

      {/* Entity Breakdown */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-sc-fg-primary mb-4">Entity Types</h3>
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats?.entity_counts ?? {}).map(([type, count]) => (
              <div
                key={type}
                className="bg-sc-bg-highlight rounded-lg p-4 border border-sc-fg-subtle/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getEntityColor(type) }}
                  />
                  <span className="text-sm font-medium text-sc-fg-muted capitalize">{type}</span>
                </div>
                <p className="text-xl font-bold text-sc-fg-primary">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-sc-fg-primary mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/graph"
            className="px-4 py-2 bg-sc-purple/20 text-sc-purple rounded-lg hover:bg-sc-purple/30 transition-colors"
          >
            ⬡ Explore Graph
          </a>
          <a
            href="/entities"
            className="px-4 py-2 bg-sc-cyan/20 text-sc-cyan rounded-lg hover:bg-sc-cyan/30 transition-colors"
          >
            ▣ Browse Entities
          </a>
          <a
            href="/search"
            className="px-4 py-2 bg-sc-coral/20 text-sc-coral rounded-lg hover:bg-sc-coral/30 transition-colors"
          >
            ⌕ Search Knowledge
          </a>
          <a
            href="/ingest"
            className="px-4 py-2 bg-sc-yellow/20 text-sc-yellow rounded-lg hover:bg-sc-yellow/30 transition-colors"
          >
            ↻ Sync Documents
          </a>
        </div>
      </div>

      {/* Errors */}
      {health?.errors && health.errors.length > 0 && (
        <div className="bg-sc-red/10 border border-sc-red/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-sc-red mb-2">Errors</h3>
          <ul className="space-y-1">
            {health.errors.map(error => (
              <li key={error} className="text-sc-fg-muted text-sm">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function getEntityColor(type: string): string {
  const colors: Record<string, string> = {
    pattern: '#e135ff',
    rule: '#ff6363',
    template: '#80ffea',
    tool: '#f1fa8c',
    language: '#ff6ac1',
    topic: '#ff00ff',
    episode: '#50fa7b',
    knowledge_source: '#8b85a0',
    config_file: '#f1fa8c',
    slash_command: '#80ffea',
  };
  return colors[type] ?? '#8b85a0';
}
