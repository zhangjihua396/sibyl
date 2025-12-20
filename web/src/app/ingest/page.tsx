'use client';

import { useState } from 'react';

import { useHealth, useIngest, useIngestStatus, useStats } from '@/lib/hooks';

export default function IngestPage() {
  const { data: health } = useHealth();
  const { data: stats, refetch: refetchStats } = useStats();
  const { data: status } = useIngestStatus();
  const ingest = useIngest();

  const [customPath, setCustomPath] = useState('');
  const [force, setForce] = useState(false);

  const handleIngest = async () => {
    await ingest.mutateAsync({
      path: customPath || undefined,
      force,
    });
    // Refetch stats after starting ingestion
    setTimeout(() => refetchStats(), 2000);
  };

  const isRunning = status?.running ?? false;
  const progress = status?.progress ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sc-fg-primary">Document Ingestion</h1>
        <p className="text-sc-fg-muted">Sync documents and extract knowledge entities</p>
      </div>

      {/* Status Card */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-sc-fg-primary">Ingestion Status</h2>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              isRunning ? 'bg-sc-yellow/20 text-sc-yellow' : 'bg-sc-green/20 text-sc-green'
            }`}
          >
            {isRunning ? 'Running' : 'Idle'}
          </span>
        </div>

        {isRunning && status && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-sc-fg-muted mb-2">
                <span>Progress</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 bg-sc-bg-highlight rounded-full overflow-hidden">
                <div
                  className="h-full bg-sc-purple rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-sc-bg-highlight rounded-lg p-3">
                <div className="text-2xl font-bold text-sc-fg-primary">
                  {status.files_processed}
                </div>
                <div className="text-xs text-sc-fg-muted">Files Processed</div>
              </div>
              <div className="bg-sc-bg-highlight rounded-lg p-3">
                <div className="text-2xl font-bold text-sc-green">{status.entities_created}</div>
                <div className="text-xs text-sc-fg-muted">Entities Created</div>
              </div>
              <div className="bg-sc-bg-highlight rounded-lg p-3">
                <div className="text-2xl font-bold text-sc-cyan">{status.entities_updated}</div>
                <div className="text-xs text-sc-fg-muted">Entities Updated</div>
              </div>
              <div className="bg-sc-bg-highlight rounded-lg p-3">
                <div className="text-2xl font-bold text-sc-red">{status.errors?.length ?? 0}</div>
                <div className="text-xs text-sc-fg-muted">Errors</div>
              </div>
            </div>

            {/* Errors */}
            {status.errors && status.errors.length > 0 && (
              <div className="bg-sc-red/10 border border-sc-red/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-sc-red mb-2">Errors</h3>
                <ul className="space-y-1 text-sm text-sc-fg-muted">
                  {status.errors.map(error => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!isRunning && (
          <p className="text-sc-fg-muted">
            Ready to ingest documents. Configure options below and start ingestion.
          </p>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Configuration</h2>

        <div className="space-y-4">
          {/* Custom Path */}
          <div>
            <label
              htmlFor="custom-path"
              className="block text-sm font-medium text-sc-fg-muted mb-2"
            >
              Custom Path (optional)
            </label>
            <input
              id="custom-path"
              type="text"
              value={customPath}
              onChange={e => setCustomPath(e.target.value)}
              placeholder="Leave empty to use default knowledge sources"
              className="w-full px-4 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-cyan focus:outline-none transition-colors font-mono"
              disabled={isRunning}
            />
            <p className="text-xs text-sc-fg-subtle mt-1">
              Specify a directory path to ingest, or leave empty to use configured sources
            </p>
          </div>

          {/* Force Re-ingest */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForce(!force)}
              disabled={isRunning}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                force ? 'bg-sc-purple' : 'bg-sc-bg-highlight'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  force ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-sc-fg-primary">Force Re-ingest</span>
              <p className="text-xs text-sc-fg-subtle">
                Re-process all files even if they haven't changed
              </p>
            </div>
          </div>

          {/* Start Button */}
          <button
            type="button"
            onClick={handleIngest}
            disabled={isRunning || ingest.isPending}
            className="w-full px-6 py-3 bg-sc-purple text-white rounded-xl hover:bg-sc-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ingesting...
              </span>
            ) : ingest.isPending ? (
              'Starting...'
            ) : (
              '↻ Start Ingestion'
            )}
          </button>
        </div>
      </div>

      {/* Current Stats */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Current Knowledge Base</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-sc-bg-highlight rounded-lg p-4">
            <div className="text-3xl font-bold text-sc-fg-primary">
              {stats?.total_entities ?? 0}
            </div>
            <div className="text-sm text-sc-fg-muted">Total Entities</div>
          </div>

          {stats?.entity_counts &&
            Object.entries(stats.entity_counts)
              .slice(0, 3)
              .map(([type, count]) => (
                <div key={type} className="bg-sc-bg-highlight rounded-lg p-4">
                  <div className="text-3xl font-bold text-sc-fg-primary">{count}</div>
                  <div className="text-sm text-sc-fg-muted capitalize">
                    {type.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Server Info */}
      <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-sc-fg-primary mb-4">Server Info</h2>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-sc-fg-subtle">Server</dt>
            <dd className="text-sc-fg-primary font-mono">{health?.server_name ?? 'sibyl'}</dd>
          </div>
          <div>
            <dt className="text-sc-fg-subtle">Status</dt>
            <dd className={health?.status === 'healthy' ? 'text-sc-green' : 'text-sc-red'}>
              {health?.status ?? 'Unknown'}
            </dd>
          </div>
          <div>
            <dt className="text-sc-fg-subtle">Graph</dt>
            <dd className={health?.graph_connected ? 'text-sc-green' : 'text-sc-red'}>
              {health?.graph_connected ? 'Connected' : 'Disconnected'}
            </dd>
          </div>
          <div>
            <dt className="text-sc-fg-subtle">Version</dt>
            <dd className="text-sc-fg-primary font-mono">0.1.0</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
