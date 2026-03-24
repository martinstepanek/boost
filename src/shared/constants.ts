import type { ITheme } from '@xterm/xterm'

// Window
export const WINDOW_WIDTH = 1200
export const WINDOW_HEIGHT = 800

// PTY defaults
export const PTY_INITIAL_COLS = 80
export const PTY_INITIAL_ROWS = 24
export const PTY_TERM_NAME = 'xterm-256color'

// Terminal
export const TERMINAL_SCROLLBACK = 5000
export const TERMINAL_FONT_SIZE = 13
export const TERMINAL_LINE_HEIGHT = 1.35
export const TERMINAL_FONT_FAMILY =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace"
export const TERMINAL_PADDING = 4

export const TERMINAL_THEME: ITheme = {
  background: '#1c1c1e',
  foreground: '#e5e5ea',
  cursor: '#0a84ff',
  cursorAccent: '#1c1c1e',
  selectionBackground: 'rgba(10, 132, 255, 0.3)',
  selectionForeground: '#f5f5f7',
  black: '#1c1c1e',
  red: '#ff453a',
  green: '#30d158',
  yellow: '#ffd60a',
  blue: '#0a84ff',
  magenta: '#bf5af2',
  cyan: '#64d2ff',
  white: '#f5f5f7',
  brightBlack: '#48484a',
  brightRed: '#ff6961',
  brightGreen: '#4cd964',
  brightYellow: '#ffdc5c',
  brightBlue: '#409cff',
  brightMagenta: '#da8aff',
  brightCyan: '#70d7ff',
  brightWhite: '#ffffff'
}

// Timing
export const SAVE_DEBOUNCE_MS = 1000
export const AUTOSAVE_INTERVAL_MS = 60_000
export const RESIZE_DEBOUNCE_MS = 50
export const REFIT_DELAY_MS = 10

// Git
export const GIT_REPO_CHECK_DEBOUNCE_MS = 500
export const GIT_STATUS_POLL_MS = 2000

// Tiling
export const SPLIT_RATIO_MIN = 0.1
export const SPLIT_RATIO_MAX = 0.9
export const DIRECTION_EPSILON = 0.001
export const DIRECTION_PERP_WEIGHT = 1000

// Pane colors (used for non-terminal pane identification)
export const PANE_COLORS = [
  '#1e3a5f',
  '#3b1f2b',
  '#1f3b2b',
  '#3b2f1f',
  '#2b1f3b',
  '#1f2b3b',
  '#3b1f1f',
  '#1f3b3b',
  '#2f3b1f',
  '#1f1f3b',
  '#4a2040',
  '#204a40',
  '#40204a',
  '#4a4020',
  '#20404a'
]
