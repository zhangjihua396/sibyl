'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import type { SearchResult } from '@/lib/api';
import { useSearch, useStats } from '@/lib/hooks';

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

function SearchResultCard({ result }: { result: SearchResult }) {
  const colorClasses = entityColors[result.type] || entityColors.knowledge_source;
  const scorePercent = Math.round(result.score * 100);

  return (
    <Link
      href={`/entities/${result.id}`}
      className="block bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl p-4 hover:border-sc-purple/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs rounded border capitalize ${colorClasses}`}>
              {result.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-sc-fg-subtle">{scorePercent}% match</span>
          </div>
          <h3 className="text-lg font-semibold text-sc-fg-primary truncate">{result.name}</h3>
          {result.content && (
            <p className="text-sc-fg-muted text-sm mt-1 line-clamp-2">{result.content}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {/* Score bar */}
          <div className="w-16 h-1.5 bg-sc-bg-highlight rounded-full overflow-hidden">
            <div
              className="h-full bg-sc-purple rounded-full transition-all"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useStats();
  const entityTypes = stats ? Object.keys(stats.entity_counts) : [];

  const {
    data: results,
    isLoading,
    error,
  } = useSearch(
    {
      query: submittedQuery,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      limit: 50,
    },
    submittedQuery.length > 0
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query);
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-sc-fg-primary">Search Knowledge</h1>
        <p className="text-sc-fg-muted">Semantic search across all entities</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-fg-muted text-lg">
              ⌕
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for patterns, rules, templates..."
              className="w-full pl-12 pr-4 py-3 bg-sc-bg-base border border-sc-fg-subtle/20 rounded-xl text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-purple focus:outline-none transition-colors text-lg"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-6 py-3 bg-sc-purple text-white rounded-xl hover:bg-sc-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Search
          </button>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sc-fg-muted text-sm py-1.5">Filter by type:</span>
          {entityTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                selectedTypes.includes(type)
                  ? 'bg-sc-purple/20 text-sc-purple border border-sc-purple/30'
                  : 'bg-sc-bg-highlight text-sc-fg-muted border border-sc-fg-subtle/10 hover:border-sc-fg-subtle/30'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {submittedQuery && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sc-red">Search failed</p>
              <p className="text-sc-fg-muted text-sm mt-1">{error.message}</p>
            </div>
          ) : results && results.results.length > 0 ? (
            <>
              <div className="text-sc-fg-muted text-sm">
                Found {results.results.length} results for "{submittedQuery}"
              </div>
              <div className="space-y-3">
                {results.results.map((result: SearchResult) => (
                  <SearchResultCard key={result.id} result={result} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sc-fg-muted text-lg">No results found</p>
              <p className="text-sc-fg-subtle text-sm mt-1">
                Try different keywords or remove type filters
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!submittedQuery && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⌕</div>
          <p className="text-sc-fg-muted text-lg">Enter a search query to find knowledge</p>
          <p className="text-sc-fg-subtle text-sm mt-2">
            Semantic search finds related concepts, not just exact matches
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-sc-purple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
