'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { SearchInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/toggle';
import { LoadingState } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/layout/page-header';
import { SearchResultCard } from '@/components/search/search-result';
import type { SearchResult } from '@/lib/api';
import { useSearch, useStats } from '@/lib/hooks';

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
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Search Knowledge"
        description="Semantic search across all entities"
      />

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for patterns, rules, templates..."
              onSubmit={() => setSubmittedQuery(query)}
            />
          </div>
          <Button type="submit" size="lg" disabled={!query.trim()}>
            Search
          </Button>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sc-fg-muted text-sm py-1.5">Filter by type:</span>
          {entityTypes.map((type) => (
            <FilterChip
              key={type}
              active={selectedTypes.includes(type)}
              onClick={() => toggleType(type)}
            >
              {type.replace(/_/g, ' ')}
            </FilterChip>
          ))}
        </div>
      </form>

      {/* Results */}
      {submittedQuery ? (
        <div className="space-y-4">
          {isLoading ? (
            <LoadingState message="Searching knowledge base..." />
          ) : error ? (
            <ErrorState title="Search failed" message={error.message} />
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
            <EmptyState
              icon="∅"
              title="No results found"
              description="Try different keywords or remove type filters"
            />
          )}
        </div>
      ) : (
        <EmptyState
          icon="⌕"
          title="Enter a search query to find knowledge"
          description="Semantic search finds related concepts, not just exact matches"
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SearchPageContent />
    </Suspense>
  );
}
