export const THEME_ACCENT_COLORS = {
  default: 'hsl(173 64% 48%)',
  zinc: 'hsl(220 9% 46%)',
  rose: 'hsl(347 89% 61%)',
  blue: 'hsl(221 83% 53%)',
  orange: 'hsl(25 95% 53%)',
  violet: 'hsl(270 60% 50%)',
} as const;

export const THEME_OPTIONS = [
  { name: 'Default', value: 'default', color: 'hsl(173 64% 48%)' },
  { name: 'Zinc', value: 'zinc', color: 'hsl(220 9% 46%)' },
  { name: 'Rose', value: 'rose', color: 'hsl(347 89% 61%)' },
  { name: 'Blue', value: 'blue', color: 'hsl(221 83% 53%)' },
  { name: 'Orange', value: 'orange', color: 'hsl(25 95% 53%)' },
  { name: 'Violet', value: 'violet', color: 'hsl(270 60% 50%)' },
] as const;

export const COLOR_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#64748b',
] as const;

export const TASK_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const;

export const PRIORITY_COLORS = {
  Urgent: 'hsl(var(--destructive))',
  High: 'hsl(var(--warning))',
  Medium: 'hsl(var(--primary))',
  Low: 'hsl(var(--muted-foreground))',
} as const;

export const PRIORITY_STYLES = {
  Urgent: 'border-l-red-500',
  High: 'border-l-orange-400',
  Medium: 'border-l-blue-400',
  Low: 'border-l-zinc-500',
} as const;

export const PRIORITY_ORDER = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
} as const;

export const SIDEBAR_CONSTANTS = {
  COOKIE_NAME: 'sidebar_state',
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  WIDTH: '16rem',
  WIDTH_MOBILE: '18rem',
  WIDTH_ICON: '3rem',
  KEYBOARD_SHORTCUT: 'b',
} as const;

export const TIME_OPTIONS = {
  HOURS: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
  MINUTES: ['00', '15', '30', '45'],
} as const;

export const DEFAULT_PROJECT_SETTINGS = {
  ENABLE_SUBTASKS: true,
  ENABLE_DEADLINES: true,
  ENABLE_LABELS: true,
  ENABLE_DASHBOARD: true,
} as const;

export const DEFAULT_LABELS = [
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#3b82f6' },
  { name: 'Improvement', color: '#22c55e' },
] as const;

export const DEFAULT_COLUMNS = [{ title: 'To Do' }, { title: 'In Progress' }, { title: 'Done' }] as const;

export const APP_METADATA = {
  NAME: 'OpenKanban',
  SHORT_NAME: 'OpenKanban',
  DESCRIPTION: 'A modern, open-source Kanban board to streamline your workflow.',
  START_URL: '/',
  DISPLAY: 'standalone',
  BACKGROUND_COLOR: '#0F172A',
} as const;

export const STORAGE_KEYS = {
  THEME_MODE: 'theme-mode',
  THEME_ACCENT: 'theme-accent',
  LAST_ACTIVE_PROJECT: 'lastActiveProjectId',
} as const;

export const SEARCH_CONSTANTS = {
  MIN_QUERY_LENGTH: 2,
} as const;

export const MAX_PROJECT_NAME_LENGTH = 50;
export const MAX_PROJECT_DESC_LENGTH = 200;
export const MAX_COLUMN_TITLE_LENGTH = 30;
export const MAX_LABEL_NAME_LENGTH = 20;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESC_LENGTH = 500;
export const MAX_SUBTASK_TITLE_LENGTH = 100;
export const MAX_COMMENT_LENGTH = 500;

export const CURSOR_INACTIVITY_TIMEOUT_SECONDS = 5;
