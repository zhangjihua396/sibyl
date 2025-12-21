'use client';

import { Command, Loader2, Search, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useConnectionStatus, useHealth } from '@/lib/hooks';

export function Header() {
  const router = useRouter();
  const { data: health } = useHealth();
  const wsStatus = useConnectionStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [router, searchQuery]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search') as HTMLInputElement;
        input?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine overall connection state
  const isConnected = health?.status === 'healthy' && wsStatus === 'connected';
  const isReconnecting = wsStatus === 'reconnecting' || wsStatus === 'connecting';

  // Status config
  const statusConfig = isConnected
    ? { icon: Wifi, label: 'Live', color: 'sc-green' }
    : isReconnecting
      ? { icon: Loader2, label: 'Syncing', color: 'sc-yellow' }
      : { icon: WifiOff, label: 'Offline', color: 'sc-red' };

  return (
    <header className="h-14 bg-sc-bg-base border-b border-sc-fg-subtle/10 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
          <label htmlFor="global-search" className="sr-only">
            Search knowledge base
          </label>

          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
              isFocused
                ? 'text-sc-purple drop-shadow-[0_0_8px_rgba(225,53,255,0.5)]'
                : 'text-sc-fg-muted'
            }`}
            strokeWidth={2}
          />

          <input
            id="global-search"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search knowledge..."
            className={`
              w-full pl-10 pr-20 py-2 rounded-lg
              bg-sc-bg-highlight/50 border text-sc-fg-primary
              placeholder:text-sc-fg-subtle/60
              transition-all duration-300
              focus:outline-none
              ${
                isFocused
                  ? 'border-sc-purple/50 shadow-[0_0_20px_rgba(225,53,255,0.15),inset_0_0_20px_rgba(225,53,255,0.05)]'
                  : 'border-sc-fg-subtle/10 hover:border-sc-fg-subtle/20'
              }
            `}
          />

          {/* Keyboard hint */}
          <div
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              text-[10px] font-mono px-1.5 py-1 rounded
              border hidden md:flex items-center gap-1
              transition-all duration-300
              ${
                isFocused
                  ? 'bg-sc-purple/20 border-sc-purple/30 text-sc-purple'
                  : 'bg-sc-bg-base/50 border-sc-fg-subtle/20 text-sc-fg-subtle'
              }
            `}
          >
            <Command size={10} strokeWidth={2.5} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          text-xs font-medium tracking-wide uppercase
          border transition-all duration-500
          ${
            isConnected
              ? 'bg-sc-green/5 border-sc-green/20 text-sc-green'
              : isReconnecting
                ? 'bg-sc-yellow/5 border-sc-yellow/20 text-sc-yellow'
                : 'bg-sc-red/5 border-sc-red/20 text-sc-red'
          }
        `}
      >
        <statusConfig.icon
          size={14}
          strokeWidth={2.5}
          className={isReconnecting ? 'animate-spin' : ''}
        />
        <span className="hidden sm:inline">{statusConfig.label}</span>
      </div>
    </header>
  );
}
