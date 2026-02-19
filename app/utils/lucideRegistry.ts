import {
  AlarmClock,
  AlertTriangle,
  BookOpen,
  Bug,
  Calendar,
  Check,
  CircleHelp,
  ClipboardList,
  FileText,
  Flag,
  Folder,
  Hammer,
  Heart,
  Lightbulb,
  Link,
  ListTodo,
  MessageSquare,
  NotebookPen,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Target,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Lucide icon subset for v1.
 *
 * Why subset?
 * - Prevent accidental bundle bloat from exposing full icon catalog at once
 * - Keep UX focused for first release
 * - Easier to curate default/recent suggestions
 */
export const LUCIDE_ICON_REGISTRY = {
  alarmClock: AlarmClock,
  alertTriangle: AlertTriangle,
  bookOpen: BookOpen,
  bug: Bug,
  calendar: Calendar,
  check: Check,
  circleHelp: CircleHelp,
  clipboardList: ClipboardList,
  fileText: FileText,
  flag: Flag,
  folder: Folder,
  hammer: Hammer,
  heart: Heart,
  lightbulb: Lightbulb,
  link: Link,
  listTodo: ListTodo,
  messageSquare: MessageSquare,
  notebookPen: NotebookPen,
  rocket: Rocket,
  search: Search,
  settings: Settings,
  sparkles: Sparkles,
  target: Target,
  wrench: Wrench,
} as const satisfies Record<string, LucideIcon>;

export type LucideIconName = keyof typeof LUCIDE_ICON_REGISTRY;

export const LUCIDE_ICON_NAMES = Object.keys(LUCIDE_ICON_REGISTRY) as LucideIconName[];

export function isValidLucideIconName(name: string): name is LucideIconName {
  return name in LUCIDE_ICON_REGISTRY;
}

export function getLucideIconByName(name?: string | null): LucideIcon | null {
  if (!name) return null;

  const icon = LUCIDE_ICON_REGISTRY[name as LucideIconName] ?? null;
  if (!icon) {
    console.debug('[Telemetry] icon_render_fallback', {
      icon_name: name,
      source: 'direct',
      success: false,
      duration_ms: 0,
    });
  }

  return icon;
}
