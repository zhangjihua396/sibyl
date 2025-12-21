'use client';

import {
  BookOpen,
  Boxes,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  Network,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants';
import { NavLink } from './nav-link';

// Navigation with Lucide icons
const NAVIGATION: Array<{ name: string; href: string; icon: LucideIcon }> = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Sources', href: '/sources', icon: BookOpen },
  { name: 'Graph', href: '/graph', icon: Network },
  { name: 'Entities', href: '/entities', icon: Boxes },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Ingest', href: '/ingest', icon: RefreshCw },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-sc-bg-base border-r border-sc-fg-subtle/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sc-fg-subtle/10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sc-purple via-sc-magenta to-sc-coral blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            {/* Logo container */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sc-purple via-sc-magenta to-sc-coral flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sc-fg-primary tracking-tight">Sibyl</h1>
            <p className="text-[10px] text-sc-fg-subtle uppercase tracking-widest">
              Knowledge Oracle
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAVIGATION.map(item => (
          <NavLink key={item.name} href={item.href} icon={item.icon}>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sc-fg-subtle/10">
        <div className="flex items-center gap-2 text-[10px] text-sc-fg-subtle">
          <div className="w-1.5 h-1.5 rounded-full bg-sc-green animate-pulse shadow-[0_0_6px_rgba(80,250,123,0.6)]" />
          <span className="uppercase tracking-wider">
            {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
          </span>
        </div>
      </div>
    </aside>
  );
}
