# Roadmap

## Phase 1: MVP - Terminal Tiling Manager

The minimum viable product: a usable tiling terminal with workspaces.

### Milestone 1.1 - App Shell
- [ ] Scaffold T3 project and adapt for Electron
- [ ] Electron main process with BrowserWindow
- [ ] Basic React renderer loading in Electron
- [ ] Build pipeline (dev + production)

### Milestone 1.2 - Single Terminal
- [ ] xterm.js rendering in a React component
- [ ] node-pty spawning a WSL shell
- [ ] IPC bridge between xterm.js and node-pty
- [ ] Terminal resize handling
- [ ] Copy/paste support

### Milestone 1.3 - Tiling Layout
- [ ] Binary split tree data structure
- [ ] Horizontal and vertical splitting (`Win+V`, `Win+B`)
- [ ] Draggable resize handles between panes
- [ ] Close pane (`Win+Shift+Q`)
- [ ] New terminal in split (`Win+Enter`)

### Milestone 1.4 - Focus & Navigation
- [ ] Keyboard focus switching (`Win+H/J/K/L`)
- [ ] Visual focus indicator on active pane
- [ ] Pane movement (`Win+Shift+H/J/K/L`)
- [ ] Fullscreen toggle (`Win+F`)
- [ ] Resize mode (`Win+R`)

### Milestone 1.5 - Workspaces
- [ ] Workspace state management (Zustand store)
- [ ] Workspace switching (`Win+1` through `Win+9`)
- [ ] Move pane to workspace (`Win+Shift+1` through `Win+Shift+9`)
- [ ] Workspace indicator bar
- [ ] Background terminals keep running

### Milestone 1.6 - Persistence
- [ ] Save layout state to JSON on changes
- [ ] Restore layout on app startup
- [ ] Save/restore working directories
- [ ] Handle corrupt/missing state gracefully

### Milestone 1.7 - WSL Polish
- [ ] Auto-detect WSL distributions
- [ ] Configure default distribution
- [ ] Fallback to local shell when WSL unavailable
- [ ] Proper path translation for initial cwd

---

## Phase 2: Polish & Customization (Future)

- [ ] Configurable keybindings (JSON config file)
- [ ] Theme support (terminal colors, UI theme)
- [ ] Configurable font family and size
- [ ] Status bar with workspace info and system stats
- [ ] Per-pane WSL distribution selection
- [ ] Command palette (`Win+D` or similar)

## Phase 3: Browser Tabs (Future)

- [ ] Embedded browser pane using Electron webview
- [ ] Browser panes as leaf nodes in the tiling tree (same as terminals)
- [ ] URL bar, back/forward, reload
- [ ] `Win+W` to open a new browser pane
- [ ] Bookmark management

## Phase 4: Advanced Features (Future)

- [ ] Multi-monitor support (workspace per monitor)
- [ ] Session naming and management
- [ ] Split terminal (send input to multiple panes)
- [ ] Plugin/extension system
- [ ] Auto-update mechanism
