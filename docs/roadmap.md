# Roadmap

## Phase 1: MVP — Terminal Tiling Manager

### Milestone 1.1 — App Shell

- [x] Scaffold project with electron-vite (React + TypeScript)
- [x] Electron main process with BrowserWindow
- [x] tRPC over Electron IPC for type-safe communication
- [x] Build pipeline (dev + production via electron-builder)

### Milestone 1.2 — Single Terminal

- [x] xterm.js rendering in a React component
- [x] node-pty spawning a shell
- [x] IPC bridge between xterm.js and node-pty
- [x] Terminal resize handling (ResizeObserver + FitAddon)
- [x] Copy/paste support (Ctrl+C with selection, Ctrl+V)

### Milestone 1.3 — Tiling Layout

- [x] Binary split tree data structure
- [x] Horizontal and vertical splitting (`Alt+B`, `Alt+V`)
- [x] Draggable resize handles between panes
- [x] Close pane (`Alt+Shift+Q`)

### Milestone 1.4 — Focus & Navigation

- [x] Keyboard focus switching (`Alt+H/J/K/L`, `Alt+Arrows`)
- [x] Visual focus indicator (blue border on active pane)
- [x] Pane movement/swap (`Alt+Shift+H/J/K/L`, `Alt+Shift+Arrows`)
- [x] Click-to-focus

### Milestone 1.5 — Workspaces

- [x] Workspace state management (Zustand store)
- [x] Workspace switching (`Alt+1` through `Alt+9`)
- [x] Move pane to workspace (`Alt+Shift+1` through `Alt+Shift+9`)
- [x] Workspace indicator bar
- [x] Terminals persist across workspace switches (overlay architecture)

### Milestone 1.6 — Persistence

- [x] Save layout state to JSON on changes (debounced 1s)
- [x] Restore layout on app startup
- [x] Periodic autosave (60s)
- [x] Handle corrupt/missing state gracefully

### Milestone 1.7 — Design

- [x] Apple-inspired dark mode color palette
- [x] JetBrains Mono font for terminal
- [x] Design system documented

---

## Phase 2: Polish & Customization (Future)

- [ ] WSL integration (BackendTarget abstraction, auto-detect distributions)
- [ ] Configurable keybindings (JSON config file)
- [ ] Theme support (terminal colors, UI theme)
- [ ] Configurable font family and size
- [ ] Resize mode (`Alt+R`)
- [ ] Fullscreen toggle (`Alt+F`)
- [ ] Per-pane shell/distribution selection
- [ ] Command palette

## Phase 3: Browser Tabs (Future)

- [ ] Embedded browser pane using Electron webview
- [ ] Browser panes as leaf nodes in the tiling tree
- [ ] URL bar, back/forward, reload

## Phase 4: Advanced Features (Future)

- [ ] Multi-monitor support (workspace per monitor)
- [ ] Session naming and management
- [ ] Split terminal (send input to multiple panes)
- [ ] Plugin/extension system
- [ ] Auto-update mechanism
