# Boost

A tiling terminal emulator with i3-style window management, built with Electron, React, and TypeScript.

## Features

- **i3-style tiling** — binary split tree layout, per-pane split direction, 50/50 splits
- **Workspaces 1–9** — switch with `Alt+1`–`Alt+9`, created on demand
- **Focus navigation** — `Alt+H/J/K/L` or `Alt+Arrows`
- **Pane management** — split, close, move/swap panes with keyboard
- **Command palette** — `Alt+D` to launch Terminal or Claude Code
- **Terminal emulation** — xterm.js + node-pty, JetBrains Mono font
- **Claude Code integration** — launch via command palette, session persistence across restarts
- **Backend targets** — WSL, PowerShell (Windows), native shell (Linux/macOS)
- **Per-workspace path** — configurable working directory with Tab autocomplete
- **State persistence** — layout, workspaces, targets, and focus restored on restart
- **Drag-to-resize** — split dividers are draggable
- **Copy/paste** — `Ctrl+C` copies selected text, `Ctrl+V` pastes

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

## Keybindings

All shortcuts use `Alt` as the modifier key.

| Shortcut              | Action                                    |
| --------------------- | ----------------------------------------- |
| `Alt+B`               | Set focused pane split to horizontal      |
| `Alt+V`               | Set focused pane split to vertical        |
| `Alt+Enter`           | Open new terminal (uses pane's direction) |
| `Alt+Shift+Q`         | Close focused pane                        |
| `Alt+H/J/K/L`         | Focus left/down/up/right                  |
| `Alt+Arrows`          | Focus left/down/up/right                  |
| `Alt+Shift+H/J/K/L`   | Move/swap pane in direction               |
| `Alt+Shift+Arrows`    | Move/swap pane in direction               |
| `Alt+1`–`Alt+9`       | Switch to workspace                       |
| `Alt+Shift+1`–`Alt+9` | Move pane to workspace                    |
| `Alt+D`               | Open command palette                      |
| `Ctrl+C` (selection)  | Copy to clipboard                         |
| `Ctrl+V`              | Paste from clipboard                      |

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
