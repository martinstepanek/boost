# Boost

A tiling terminal emulator with i3-style window management, built with Electron, React, and TypeScript.

## Features

- **i3-style tiling** — binary split tree layout with horizontal/vertical splits
- **Workspaces 1–9** — switch with `Alt+1`–`Alt+9`, created on demand, destroyed when empty
- **Focus navigation** — `Alt+H/J/K/L` or `Alt+Arrows` to move between panes
- **Pane management** — split, close, move, and swap panes with keyboard shortcuts
- **Terminal emulation** — xterm.js with node-pty, JetBrains Mono font
- **State persistence** — layout, workspaces, and focus restored on restart
- **Drag-to-resize** — split dividers are draggable
- **Copy/paste** — `Ctrl+C` copies selected text, `Ctrl+V` pastes

## Tech Stack

- **Electron** — desktop shell
- **React 19 + TypeScript** — renderer
- **xterm.js + node-pty** — terminal emulation
- **tRPC over Electron IPC** — type-safe main↔renderer communication
- **Zustand** — state management
- **Tailwind CSS v4** — styling
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
yarn run build:linux
yarn run build:win
```

## Keybindings

All shortcuts use `Alt` as the modifier key.

| Shortcut              | Action                        |
| --------------------- | ----------------------------- |
| `Alt+B`               | Split horizontal (left/right) |
| `Alt+V`               | Split vertical (top/bottom)   |
| `Alt+Shift+Q`         | Close focused pane            |
| `Alt+H/J/K/L`         | Focus left/down/up/right      |
| `Alt+Arrows`          | Focus left/down/up/right      |
| `Alt+Shift+H/J/K/L`   | Move/swap pane in direction   |
| `Alt+Shift+Arrows`    | Move/swap pane in direction   |
| `Alt+1`–`Alt+9`       | Switch to workspace           |
| `Alt+Shift+1`–`Alt+9` | Move pane to workspace        |
| `Ctrl+C` (selection)  | Copy to clipboard             |
| `Ctrl+V`              | Paste from clipboard          |

## Documentation

See [docs/](docs/) for detailed documentation:

- [Overview](docs/overview.md) — goals and design principles
- [Architecture](docs/architecture.md) — process model and component structure
- [Design System](docs/design-system.md) — colors, typography, spacing
- [Workspaces & Tiling](docs/workspaces-and-tiling.md) — layout engine
- [Terminal & WSL](docs/terminal-and-wsl.md) — terminal emulation and WSL integration
- [Keybindings](docs/keybindings.md) — keyboard shortcuts
- [Persistence](docs/persistence.md) — state management
- [Roadmap](docs/roadmap.md) — development phases
