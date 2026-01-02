/**
 * Centralized Tool Registry
 *
 * Single source of truth for all tool metadata:
 * - Icons
 * - Status templates (playful descriptions)
 * - Input types for renderers
 *
 * Uses `as const satisfies` for full type inference while maintaining constraints.
 */

import type { IconComponent } from '@/components/ui/icons';
import {
  Check,
  Code,
  EditPencil,
  Folder,
  Globe,
  List,
  Page,
  Search,
  Settings,
  User,
  Xmark,
} from '@/components/ui/icons';

// =============================================================================
// Tool Names (Discriminated Union)
// =============================================================================

/**
 * All known tool names as a union type.
 * Enables exhaustive matching and prevents magic strings.
 */
export type ToolName =
  | 'Read'
  | 'Edit'
  | 'Write'
  | 'Bash'
  | 'Grep'
  | 'Glob'
  | 'Task'
  | 'TaskOutput'
  | 'WebSearch'
  | 'WebFetch'
  | 'LSP'
  | 'TodoWrite'
  | 'AskUserQuestion'
  | 'NotebookEdit'
  | 'MultiEdit'
  | 'KillShell'
  | 'EnterPlanMode'
  | 'ExitPlanMode'
  | 'Skill';

// =============================================================================
// Tool Entry Type
// =============================================================================

interface ToolEntry {
  /** Display icon for the tool */
  icon: IconComponent;
  /** Playful status templates - {file}, {pattern}, {agent} are substituted */
  statusTemplates?: readonly string[];
  /** Whether this tool has a custom renderer */
  hasRenderer?: boolean;
  /** Category for grouping in UI */
  category: 'file' | 'search' | 'shell' | 'agent' | 'web' | 'meta';
}

// =============================================================================
// Tool Registry
// =============================================================================

/**
 * Central registry of all tools with their metadata.
 * Use `getToolEntry()` for type-safe access with fallback.
 */
export const TOOL_REGISTRY: Record<ToolName, ToolEntry> = {
  // File operations
  Read: {
    icon: Page,
    statusTemplates: [
      'Absorbing {file}',
      'Decoding {file}',
      'Studying {file}',
      'Ingesting {file}',
      'Parsing {file}',
    ],
    hasRenderer: true,
    category: 'file',
  },
  Edit: {
    icon: EditPencil,
    statusTemplates: ['Sculpting {file}', 'Refining {file}', 'Tweaking {file}', 'Polishing {file}'],
    hasRenderer: true,
    category: 'file',
  },
  Write: {
    icon: Page,
    statusTemplates: ['Manifesting {file}', 'Conjuring {file}', 'Crafting {file}', 'Birthing {file}'],
    hasRenderer: true,
    category: 'file',
  },
  MultiEdit: {
    icon: EditPencil,
    statusTemplates: ['Multi-editing {file}', 'Batch sculpting {file}'],
    category: 'file',
  },
  NotebookEdit: {
    icon: EditPencil,
    statusTemplates: ['Editing notebook', 'Updating cells'],
    category: 'file',
  },

  // Search operations
  Grep: {
    icon: Search,
    statusTemplates: [
      'Hunting for {pattern}',
      'Seeking {pattern}',
      'Tracking {pattern}',
      'Sniffing out {pattern}',
    ],
    hasRenderer: true,
    category: 'search',
  },
  Glob: {
    icon: Folder,
    statusTemplates: ['Scouting {pattern}', 'Mapping {pattern}', 'Surveying {pattern}'],
    hasRenderer: true,
    category: 'search',
  },
  LSP: {
    icon: Code,
    statusTemplates: ['Consulting the language server', 'Asking the code oracle', 'Querying symbols'],
    category: 'search',
  },

  // Shell operations
  Bash: {
    icon: Code,
    statusTemplates: [
      'Whispering to the shell',
      'Invoking the terminal',
      'Casting shell magic',
      'Running incantations',
    ],
    hasRenderer: true,
    category: 'shell',
  },
  KillShell: {
    icon: Xmark,
    statusTemplates: ['Terminating shell', 'Stopping process'],
    category: 'shell',
  },

  // Agent operations
  Task: {
    icon: User,
    statusTemplates: ['Summoning {agent}', 'Dispatching {agent}', 'Rallying {agent}', 'Awakening {agent}'],
    category: 'agent',
  },
  TaskOutput: {
    icon: List,
    statusTemplates: ['Awaiting {agent}', 'Checking on {agent}'],
    category: 'agent',
  },
  AskUserQuestion: {
    icon: User,
    statusTemplates: ['Awaiting your wisdom', 'Seeking guidance'],
    category: 'agent',
  },

  // Web operations
  WebSearch: {
    icon: Globe,
    statusTemplates: ['Scouring the interwebs', 'Consulting the oracle', 'Querying the web'],
    category: 'web',
  },
  WebFetch: {
    icon: Globe,
    statusTemplates: ['Fetching from the void', 'Retrieving distant knowledge', 'Pulling from the ether'],
    category: 'web',
  },

  // Meta operations
  TodoWrite: {
    icon: List,
    statusTemplates: ['Updating task list', 'Organizing work'],
    category: 'meta',
  },
  EnterPlanMode: {
    icon: Settings,
    statusTemplates: ['Entering plan mode', 'Switching to planning'],
    category: 'meta',
  },
  ExitPlanMode: {
    icon: Check,
    statusTemplates: ['Exiting plan mode', 'Ready to execute'],
    category: 'meta',
  },
  Skill: {
    icon: Settings,
    statusTemplates: ['Invoking skill', 'Running skill'],
    category: 'meta',
  },
} as const;

// =============================================================================
// Fallback Entry
// =============================================================================

const FALLBACK_ENTRY: ToolEntry = {
  icon: Code,
  category: 'meta',
};

// =============================================================================
// Icon Mapping (for backend icon names)
// =============================================================================

/**
 * Maps icon names from the backend to icon components.
 * Used when the backend specifies an icon by name string.
 */
export const ICON_BY_NAME: Record<string, IconComponent> = {
  Page,
  Code,
  EditPencil,
  Search,
  Folder,
  Globe,
  User,
  List,
  Settings,
  Check,
  Xmark,
};

// =============================================================================
// Accessors
// =============================================================================

/**
 * Check if a string is a known tool name.
 */
export function isKnownTool(name: string): name is ToolName {
  return name in TOOL_REGISTRY;
}

/**
 * Get tool entry with type-safe fallback.
 */
export function getToolEntry(name: string): ToolEntry {
  if (isKnownTool(name)) {
    return TOOL_REGISTRY[name];
  }
  return FALLBACK_ENTRY;
}

/**
 * Get icon for a tool, checking both registry and backend icon names.
 */
export function getToolIcon(toolName: string, iconHint?: string): IconComponent {
  // First check if we have a hint from the backend
  if (iconHint && iconHint in ICON_BY_NAME) {
    return ICON_BY_NAME[iconHint];
  }
  // Fall back to registry
  return getToolEntry(toolName).icon;
}

/**
 * Get a playful status message for a tool with variable substitution.
 */
export function getToolStatus(toolName: string, input?: Record<string, unknown>): string | null {
  const entry = getToolEntry(toolName);
  const templates = entry.statusTemplates;
  if (!templates?.length) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];

  // Extract substitution values from input
  const filePath = input?.file_path as string | undefined;
  const file = filePath ? filePath.split('/').pop() : undefined;
  const pattern = (input?.pattern as string | undefined) ?? (input?.query as string | undefined);
  const agent = input?.subagent_type as string | undefined;

  return template
    .replace('{file}', file ?? 'file')
    .replace('{pattern}', pattern ? `"${pattern.slice(0, 20)}"` : 'matches')
    .replace('{agent}', agent ?? 'agent');
}

/**
 * Check if a tool has a custom renderer component.
 */
export function hasCustomRenderer(toolName: string): boolean {
  return getToolEntry(toolName).hasRenderer ?? false;
}

// =============================================================================
// Tool Name Constants (for imports without magic strings)
// =============================================================================

export const TOOLS = {
  READ: 'Read' as const,
  EDIT: 'Edit' as const,
  WRITE: 'Write' as const,
  BASH: 'Bash' as const,
  GREP: 'Grep' as const,
  GLOB: 'Glob' as const,
  TASK: 'Task' as const,
  TASK_OUTPUT: 'TaskOutput' as const,
  WEB_SEARCH: 'WebSearch' as const,
  WEB_FETCH: 'WebFetch' as const,
  LSP: 'LSP' as const,
  TODO_WRITE: 'TodoWrite' as const,
  ASK_USER: 'AskUserQuestion' as const,
  NOTEBOOK_EDIT: 'NotebookEdit' as const,
  MULTI_EDIT: 'MultiEdit' as const,
  KILL_SHELL: 'KillShell' as const,
  ENTER_PLAN: 'EnterPlanMode' as const,
  EXIT_PLAN: 'ExitPlanMode' as const,
  SKILL: 'Skill' as const,
} as const;
