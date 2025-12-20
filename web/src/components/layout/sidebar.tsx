'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '◆' },
  { name: 'Graph', href: '/graph', icon: '⬡' },
  { name: 'Entities', href: '/entities', icon: '▣' },
  { name: 'Search', href: '/search', icon: '⌕' },
  { name: 'Ingest', href: '/ingest', icon: '↻' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sc-bg-base border-r border-sc-fg-subtle/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sc-fg-subtle/20">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sc-purple to-sc-magenta flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sc-fg-primary">Sibyl</h1>
            <p className="text-xs text-sc-fg-muted">Knowledge Oracle</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sc-purple/20 text-sc-purple'
                  : 'text-sc-fg-muted hover:text-sc-fg-primary hover:bg-sc-bg-highlight'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sc-fg-subtle/20">
        <div className="text-xs text-sc-fg-subtle">
          <p>Sibyl v0.1.0</p>
          <p className="text-sc-cyan">localhost:3334</p>
        </div>
      </div>
    </aside>
  );
}
