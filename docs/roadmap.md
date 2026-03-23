# Roadmap

## Phase 1: MVP — Terminal Tiling Manager (Complete)

### Milestone 1.1 — App Shell

- [x] Scaffold project with electron-vite (React + TypeScript)
- [x] Electron main process with BrowserWindow
- [x] tRPC over Electron IPC for type-safe communication
- [x] Build pipeline (dev + production via electron-builder)
- [x] GitHub Actions CI for Windows builds on tag push

### Milestone 1.2 — Single Terminal

- [x] xterm.js rendering in a React component
- [x] node-pty spawning a shell
- [x] IPC bridge between xterm.js and node-pty
- [x] Terminal resize handling (ResizeObserver + FitAddon)
- [x] Copy/paste support (Ctrl+C with selection, Ctrl+V)

### Milestone 1.3 — Tiling Layout

- [x] Binary split tree data structure
- [x] Per-pane split direction (i3-style: Alt+B horizontal, Alt+V vertical)
- [x] Draggable resize handles between panes
- [x] Close pane (Alt+Shift+Q)
- [x] New terminal via Alt+Enter (uses focused pane's direction)
- [x] Pure 50/50 splits with no rebalancing (true i3 behavior)

### Milestone 1.4 — Focus & Navigation

- [x] Keyboard focus switching (Alt+H/J/K/L, Alt+Arrows)
- [x] Visual focus indicator (overlay border on active pane)
- [x] Pane movement/swap (Alt+Shift+H/J/K/L, Alt+Shift+Arrows)
- [x] Click-to-focus
- [x] Geometric focus navigation (nearest pane in direction)

### Milestone 1.5 — Workspaces

- [x] Workspace state management (Zustand store)
- [x] Workspace switching (Alt+1 through Alt+9)
- [x] Move pane to workspace (Alt+Shift+1 through Alt+Shift+9)
- [x] Workspace indicator bar with folder name
- [x] Terminals persist across workspace switches (overlay architecture)
- [x] Per-workspace configurable working directory with Tab autocomplete

### Milestone 1.6 — Persistence

- [x] Save layout state to JSON on changes (debounced 1s)
- [x] Restore layout on app startup
- [x] Periodic autosave (60s) + save on app close
- [x] Handle corrupt/missing state gracefully
- [x] Backward-compatible with old state formats

### Milestone 1.7 — Design & UX

- [x] Apple-inspired dark mode color palette
- [x] JetBrains Mono font for terminal
- [x] Design system documented
- [x] shadcn/ui component library (Button, Input, Command)

### Milestone 1.8 — Backend Targets

- [x] BackendTarget abstraction (interface + resolver)
- [x] LocalTarget (Linux/macOS native shell)
- [x] WslTarget (Windows → WSL via wsl.exe)
- [x] PowershellTarget (Windows native PowerShell)
- [x] Per-workspace target selection (tabs in workspace setup)
- [x] Target-aware homedir, listDir, shell spawning

### Milestone 1.9 — Command Palette & Apps

- [x] Command palette (Alt+D) with shadcn Command component
- [x] Extensible app registry (src/shared/app-registry.ts)
- [x] Terminal app (default shell)
- [x] Claude Code app (spawns claude CLI)
- [x] Claude session persistence (poll PID → ~/.claude/sessions/)
- [x] Generic pane model: app + params (future-proof for new apps)

---

## Phase 2: Polish & Customization (Future)

- [ ] Configurable keybindings (JSON config file)
- [ ] Resize mode (Alt+R)
- [ ] Fullscreen toggle (Alt+F)
- [ ] Theme support (terminal colors, UI theme)
- [ ] Configurable font family and size
- [ ] Per-pane shell/distribution selection
- [ ] SSH backend target

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
