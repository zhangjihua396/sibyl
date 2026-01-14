// =============================================================================
// Navigation & Quick Actions
// =============================================================================

// Navigation items for sidebar (legacy - use COMMAND_NAV in command-palette.tsx)
export const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: '◆' },
  { name: '项目', href: '/projects', icon: '◇' },
  { name: '任务', href: '/tasks', icon: '☰' },
  { name: '数据源', href: '/sources', icon: '▤' },
  { name: '图谱', href: '/graph', icon: '⬡' },
  { name: '知识实体', href: '/entities', icon: '▣' },
  { name: '搜索', href: '/search', icon: '⌕' },
] as const;

// Quick actions for dashboard
export const QUICK_ACTIONS = [
  { label: 'Explore Graph', href: '/graph', icon: '⬡', color: 'purple' as const },
  { label: 'Browse Entities', href: '/entities', icon: '▣', color: 'cyan' as const },
  { label: 'Search Knowledge', href: '/search', icon: '⌕', color: 'coral' as const },
  { label: '添加数据源', href: '/sources', icon: '▤', color: 'yellow' as const },
] as const;
