# Boost

A tiling terminal emulator built with Electron, React, and TypeScript.

### i3-style tiling window manager

Binary split tree layout with per-pane split direction, keyboard-driven focus navigation, pane movement/swap, drag-to-resize, and 9 independent workspaces.

### Cross-platform terminal support

Run **Bash** (Linux/macOS), **WSL** (Windows), or **PowerShell** (Windows) — each workspace picks its own backend target.

### Full state persistence

Close the app, reopen it — your entire layout, workspaces, working directories, and pane arrangement are restored exactly as you left them.

### Git worktree management

Work on multiple features simultaneously — create and switch between git worktrees from the workspace setup screen. Each workspace can target a different worktree, so all terminals and Claude Code sessions in that workspace operate on the same branch.

### Claude Code with session persistence

Launch Claude Code from the command palette. Your conversation session ID is tracked per-pane and automatically resumed on next app start — pick up right where you left off.

## More Features

- **Workspaces 1–9** — switch with `Alt+1`–`Alt+9`, created on demand
- **Command palette** — `Alt+D` to launch Terminal, Claude Code, or future apps
- **Per-workspace path** — configurable working directory with Tab autocomplete
- **Focus navigation** — `Alt+H/J/K/L` or `Alt+Arrows`
- **Copy/paste** — `Ctrl+C` copies selected text, `Ctrl+V` pastes
- **JetBrains Mono** — terminal font with Apple-inspired dark theme

## Tech Stack

- **Electron** — desktop shell
- **React 19 + TypeScript** — renderer
- **xterm.js + node-pty** — terminal emulation
- **tRPC over Electron IPC** — type-safe main↔renderer communication
- **Zustand** — state management
- **Tailwind CSS v4 + shadcn/ui** — styling and components
- **Vite** — bundling via electron-vite

## Getting Started

```bash
# Requires Node.js 22+ (use nvm)
nvm use

# Install dependencies
yarn install

# Start development
yarn run dev

# Build for production
yarn run build
yarn run build:win    # Windows (via CI or with wine)
```

## Manual

### Workspace setup

When you open a new workspace, you see the setup screen. Type a path (with `Tab` autocomplete) and press `Alt+Enter` to open a terminal. Press `Alt+D` to open the launcher and pick an app (Terminal, Claude Code).

If the path is a git repository, worktree controls appear below the input. Use `↓` to enter the worktree selector, `←`/`→` to navigate between branches, and `Enter` to open a workspace in that worktree. Press `+ New` (or navigate to it and press `Enter`) to create a new worktree with a branch name.

### Tiling

Boost uses i3-style binary splits. Each pane remembers its own split direction.

- `Alt+B` — set split direction to horizontal
- `Alt+V` — set split direction to vertical
- `Alt+Enter` — split focused pane and open a new terminal

Splits are always 50/50. Three panes in the same direction gives 50/25/25, not 33/33/33.

### Focus and movement

- `Alt+H/J/K/L` or `Alt+Arrows` — move focus left/down/up/right
- `Alt+Shift+H/J/K/L` or `Alt+Shift+Arrows` — move/swap pane in direction

### Tabs

- `Alt+W` — convert split into tabbed layout
- `Alt+E` — convert tabs back into split layout
- `Alt+[` / `Alt+]` — cycle tabs

### Workspaces

- `Alt+1`–`Alt+9` — switch to workspace (created on demand)
- `Alt+Shift+1`–`Alt+9` — move focused pane to workspace

### Apps and launcher

- `Alt+D` — open command palette (Terminal, Claude Code, future apps)
- `Alt+Shift+Q` — close focused pane

### Clipboard

- `Ctrl+C` with selection — copy to clipboard
- `Ctrl+C` without selection — send SIGINT
- `Ctrl+V` — paste from clipboard

### Worktree selector (setup screen)

| Key                | Action                                     |
| ------------------ | ------------------------------------------ |
| `↓`                | Enter worktree selector from path input    |
| `←` / `→`         | Navigate between worktree pills            |
| `Enter`            | Select worktree or open "+ New" input      |
| `↑` / `Escape`    | Return focus to path input                 |
| `Delete`           | Remove focused worktree (non-main only)    |
| `Enter` on confirm | Force-delete worktree with uncommitted changes |
| `Escape` on confirm| Cancel deletion                            |

## Documentation

See [docs/](docs/) for detailed documentation:

- [Overview](docs/overview.md) — goals and design principles
- [Architecture](docs/architecture.md) — process model and component structure
- [Design System](docs/design-system.md) — colors, typography, spacing
- [Workspaces & Tiling](docs/workspaces-and-tiling.md) — layout engine
- [Terminal & WSL](docs/terminal-and-wsl.md) — terminal emulation and backend targets
- [Keybindings](docs/keybindings.md) — keyboard shortcuts
- [Persistence](docs/persistence.md) — state management
- [Roadmap](docs/roadmap.md) — development phases
