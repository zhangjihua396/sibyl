'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

import { useDeleteEntity, useEntities, useStats } from '@/lib/hooks';

const entityColors: Record<string, string> = {
  pattern: 'bg-[#e135ff]/20 text-[#e135ff] border-[#e135ff]/30',
  rule: 'bg-[#ff6363]/20 text-[#ff6363] border-[#ff6363]/30',
  template: 'bg-[#80ffea]/20 text-[#80ffea] border-[#80ffea]/30',
  tool: 'bg-[#f1fa8c]/20 text-[#f1fa8c] border-[#f1fa8c]/30',
  language: 'bg-[#ff6ac1]/20 text-[#ff6ac1] border-[#ff6ac1]/30',
  topic: 'bg-[#ff00ff]/20 text-[#ff00ff] border-[#ff00ff]/30',
  episode: 'bg-[#50fa7b]/20 text-[#50fa7b] border-[#50fa7b]/30',
  knowledge_source: 'bg-[#8b85a0]/20 text-[#8b85a0] border-[#8b85a0]/30',
  config_file: 'bg-[#f1fa8c]/20 text-[#f1fa8c] border-[#f1fa8c]/30',
  slash_command: 'bg-[#80ffea]/20 text-[#80ffea] border-[#80ffea]/30',
};

function EntityCard({
  entity,
  onDelete,
}: {
  entity: {
    id: string;
    entity_type: string;
    name: string;
    description?: string | null;
    source_file?: string | null;
  };
  onDelete?: (id: string) => void;
}) {
  const colorClasses = entityColors[entity.entity_type] || entityColors.knowledge_source;

  return (
    <div className="bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-4 hover:border-sc-purple/30 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs rounded border capitalize ${colorClasses}`}>
              {entity.entity_type.replace(/_/g, ' ')}
            </span>
          </div>
          <Link
            href={`/entities/${entity.id}`}
            className="block group-hover:text-sc-purple transition-colors"
          >
            <h3 className="text-lg font-semibold text-sc-fg-primary truncate">{entity.name}</h3>
          </Link>
          {entity.description && (
            <p className="text-sc-fg-muted text-sm mt-1 line-clamp-2">{entity.description}</p>
          )}
          {entity.source_file && (
            <p className="text-sc-fg-subtle text-xs mt-2 font-mono truncate">
              {entity.source_file}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/entities/${entity.id}`}
            className="p-2 text-sc-fg-muted hover:text-sc-cyan transition-colors"
            title="View"
          >
            ⧉
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entity.id)}
              className="p-2 text-sc-fg-muted hover:text-sc-red transition-colors"
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EntitiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get('type') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useEntities({
    entity_type: typeFilter,
    page,
    page_size: limit,
  });

  const { data: stats } = useStats();
  const deleteEntity = useDeleteEntity();

  const entityTypes = stats ? Object.keys(stats.entity_counts) : [];

  const handleTypeFilter = useCallback(
    (type: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (type) {
        params.set('type', type);
      } else {
        params.delete('type');
      }
      params.set('page', '1');
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to delete this entity?')) {
        await deleteEntity.mutateAsync(id);
      }
    },
    [deleteEntity]
  );

  const filteredEntities =
    data?.entities.filter(
      e =>
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sc-fg-primary">Entities</h1>
          <p className="text-sc-fg-muted">Browse and manage knowledge entities</p>
        </div>
        <div className="text-sc-fg-subtle">{data?.total ?? 0} total entities</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter entities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-cyan focus:outline-none transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTypeFilter(null)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              !typeFilter
                ? 'bg-sc-purple/20 text-sc-purple border border-sc-purple/30'
                : 'bg-sc-bg-highlight text-sc-fg-muted border border-sc-fg-subtle/10 hover:border-sc-fg-subtle/30'
            }`}
          >
            All
          </button>
          {entityTypes.map(type => (
            <button
              type="button"
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                typeFilter === type
                  ? 'bg-sc-purple/20 text-sc-purple border border-sc-purple/30'
                  : 'bg-sc-bg-highlight text-sc-fg-muted border border-sc-fg-subtle/10 hover:border-sc-fg-subtle/30'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sc-red">Failed to load entities</p>
          <p className="text-sc-fg-muted text-sm mt-1">{error.message}</p>
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sc-fg-muted text-lg">No entities found</p>
          <p className="text-sc-fg-subtle text-sm mt-1">
            {searchQuery
              ? 'Try a different search term'
              : 'Ingest some documents to populate entities'}
          </p>
        </div>
      ) : (
        <>
          {/* Entity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntities.map(entity => (
              <EntityCard key={entity.id} entity={entity} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg bg-sc-bg-highlight border border-sc-fg-subtle/20 text-sc-fg-muted hover:text-sc-fg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sc-fg-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg bg-sc-bg-highlight border border-sc-fg-subtle/20 text-sc-fg-muted hover:text-sc-fg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EntitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EntitiesPageContent />
    </Suspense>
  );
}
