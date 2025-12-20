'use client';

import { useHealth } from '@/lib/hooks';

export function Header() {
  const { data: health } = useHealth();

  return (
    <header className="h-14 bg-sc-bg-base border-b border-sc-fg-subtle/20 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sc-fg-muted">⌕</span>
          <input
            type="text"
            placeholder="Search knowledge... (⌘K)"
            className="w-full pl-10 pr-4 py-2 bg-sc-bg-highlight border border-sc-fg-subtle/20 rounded-lg text-sc-fg-primary placeholder:text-sc-fg-subtle focus:border-sc-cyan focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              health?.status === 'healthy'
                ? 'bg-sc-green'
                : health?.status === 'unhealthy'
                  ? 'bg-sc-red'
                  : 'bg-sc-yellow'
            }`}
          />
          <span className="text-sm text-sc-fg-muted">
            {health?.status === 'healthy' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
