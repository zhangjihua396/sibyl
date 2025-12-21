/**
 * SilkCircuit Icon System
 *
 * Centralized icon exports with consistent styling.
 * Using Lucide icons with electric neon aesthetic.
 */

import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleCheck,
  CircleDot,
  CirclePause,
  CircleX,
  Clock,
  Command,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Folder,
  FolderKanban,
  Github,
  Globe,
  Hash,
  LayoutDashboard,
  Link,
  ListTodo,
  Loader2,
  type LucideIcon,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SortAsc,
  SortDesc,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

// Re-export all icons
export {
  Search,
  Command,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  BookOpen,
  Network,
  Boxes,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  Loader2,
  Zap,
  Circle,
  CircleDot,
  CircleCheck,
  CirclePause,
  CircleX,
  Clock,
  Archive,
  Sparkles,
  Activity,
  Wifi,
  WifiOff,
  Settings,
  ExternalLink,
  Github,
  Globe,
  FileText,
  Folder,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Link,
  Copy,
  Download,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Users,
  Tag,
  Hash,
  Star,
  Flame,
};

export type { LucideIcon };

// =============================================================================
// Navigation Icons
// =============================================================================

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  tasks: ListTodo,
  sources: BookOpen,
  graph: Network,
  entities: Boxes,
  search: Search,
  ingest: RefreshCw,
} as const;

// =============================================================================
// Status Icons with SilkCircuit colors
// =============================================================================

export const STATUS_ICONS = {
  backlog: Circle,
  todo: CircleDot,
  doing: Loader2,
  blocked: CirclePause,
  review: Clock,
  done: CircleCheck,
  archived: Archive,
} as const;

export const PRIORITY_ICONS = {
  critical: Flame,
  high: Zap,
  medium: Star,
  low: Circle,
  someday: Clock,
} as const;

// =============================================================================
// Icon wrapper with consistent sizing
// =============================================================================

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export function Icon({ icon: IconComponent, size = 'md', className = '' }: IconProps) {
  return <IconComponent size={ICON_SIZES[size]} className={className} strokeWidth={2} />;
}

// =============================================================================
// Animated status indicator
// =============================================================================

interface StatusIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected';
  showLabel?: boolean;
}

export function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const config = {
    connected: {
      icon: Wifi,
      label: 'Live',
      className: 'text-sc-green',
      glow: 'shadow-[0_0_8px_rgba(80,250,123,0.8)]',
      bg: 'bg-sc-green/5 border-sc-green/20',
    },
    connecting: {
      icon: Loader2,
      label: 'Syncing',
      className: 'text-sc-yellow animate-spin',
      glow: '',
      bg: 'bg-sc-yellow/5 border-sc-yellow/20',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Offline',
      className: 'text-sc-red',
      glow: 'shadow-[0_0_8px_rgba(255,99,99,0.6)]',
      bg: 'bg-sc-red/5 border-sc-red/20',
    },
  };

  const { icon: IconComponent, label, className, bg } = config[status];

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        text-xs font-medium tracking-wide uppercase
        border transition-all duration-500
        ${bg} ${className}
      `}
    >
      <IconComponent size={14} strokeWidth={2.5} />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </div>
  );
}
