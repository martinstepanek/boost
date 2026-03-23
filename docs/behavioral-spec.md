# Behavioral Specification

This document captures all specific behavioral decisions made during development. It serves as a basis for future tests.

## Tiling

### Split behavior (i3-style)

- Each new split is always **50/50** — no rebalancing of existing pane sizes
- **No chain rebalancing** — adding a 3rd pane in same direction gives 50/25/25, not 33/33/33
- Split direction is **per-pane**, not global — each pane remembers its own `splitDirection`
- `Alt+B` sets the **focused pane's** split direction to horizontal
- `Alt+V` sets the **focused pane's** split direction to vertical
- `Alt+Enter` creates a new pane using the **focused pane's** split direction

### Pane movement (Alt+Shift+Direction)

- Changes the parent split's direction to match movement axis and repositions focused pane
- If already in correct direction and position, **swaps** with the geometric neighbor
- If inside a **tab group**, extracts the pane from tabs and creates a split in that direction

### Focus navigation (Alt+Direction)

- Uses **geometric search** — finds nearest visible pane in the given direction
- Uses `e.code` (not `e.key`) for layout independence
- All `Alt` key events call `e.preventDefault()` to prevent Electron menu bar activation
- xterm.js blocks all `Alt+key` via `attachCustomKeyEventHandler`

### Tab navigation priority

- When inside a tab group and **not at the edge**: Alt+Arrow **cycles tabs** (takes priority over geometric nav)
- When at **first tab + going left**, or **last tab + going right**: **falls through** to geometric navigation to jump out of the tab group
- `Alt+[` and `Alt+]` always cycle tabs regardless of position

### Tab layout

- `Alt+W` converts the parent split of the focused pane into a **tabbed container**
- `Alt+E` converts a tab group back to a **split layout** (balanced binary tree)
- `Alt+Enter` inside a tab group adds a **new tab** (not a nested split)
- `Alt+Shift+Q` inside a tab closes the **active tab**; if one tab remains, the tab container unwraps
- Only the **active tab's content** is rendered; other tabs' terminals keep running (no unmount)
- Tab bar shows at the top with labels; active tab highlighted; focused tab has accent border

### Closing panes

- `Alt+Shift+Q` closes the focused pane
- If last pane in workspace, workspace layout becomes `null` (shows setup screen, workspace is NOT deleted)
- Focus moves to the first remaining pane in the tree

## Workspaces

### Creation and switching

- Workspaces 1–9, switched with `Alt+1` through `Alt+9`
- New workspace created **on demand** — starts with `layout: null` (setup screen, no terminal)
- Workspace is NOT deleted when last pane closes — it stays with empty layout
- All workspaces stay **mounted in DOM** (hidden with `display: none`), so terminals survive switches

### Workspace setup screen

- Shown when `workspace.layout === null`
- Path input with **homedir prefix** (auto-detected from backend target)
- **Tab autocomplete** on the path input: completes longest common prefix of matching directories
- Single match appends `/`; multiple matches complete to common prefix
- **Browse button** opens native folder picker via Electron dialog
- Input is **auto-focused** when switching to a workspace with no terminals
- Input has `spellCheck=false`, `autoComplete=off`, `autoCorrect=off`
- Hint text: "Alt+Enter to open terminal"
- Path separator adapts: `\` for Windows paths, `/` for Unix

### Per-workspace target

- Each workspace stores a `targetId` (e.g., `local`, `wsl:Ubuntu`, `powershell`)
- **Target selector tabs** shown in workspace setup only when multiple targets available (Windows)
- Switching target resets path input and updates homedir

### Moving panes between workspaces

- `Alt+Shift+1-9` moves the focused pane to workspace N
- If target workspace exists with panes, the moved pane is added via a split
- If target workspace is empty, the moved pane becomes the sole layout
- Source workspace keeps its layout (minus the moved pane); if empty, layout becomes `null`

## Terminal Emulation

### PTY lifecycle

- Each pane gets its own PTY spawned in the main process
- PTY is **NOT killed** on React unmount (workspace switch) — only `destroyTerminal()` kills it
- `destroyTerminal()` is called when a pane is explicitly closed (`Alt+Shift+Q`)
- Terminal overlay architecture: all terminals in a flat layer, positioned with `fixed` CSS

### Focus

- Terminal receives DOM focus when `isFocused && isVisible` both true
- Switching workspace triggers refit + focus on the active workspace's focused pane
- Click-to-focus via `onMouseDown` on the pane placeholder div

### Clipboard

- `Ctrl+C` with text selected → **copies** to clipboard (does not send SIGINT)
- `Ctrl+C` without selection → sends SIGINT to terminal (normal behavior)
- `Ctrl+V` → **pastes** from clipboard

### Resize

- Split dividers draggable with mouse
- `ResizeObserver` on terminal container, debounced 50ms
- Refit on workspace visibility change, delayed 10ms
- Mouse drag cleanup on `mouseup` and `window blur` (fixes mouse-leaves-window leak)

## Command Palette

- `Alt+D` toggles open/close
- `Escape` closes
- Click outside closes
- Lists apps from `APP_REGISTRY` (extensible array in `src/shared/app-registry.ts`)
- Current apps: **Terminal** (default shell) and **Claude Code** (spawns `claude` CLI)
- Selecting an app creates a new pane for that app

## App System

### Generic pane model

- Each pane has `app: string` and `params: Record<string, unknown>`
- Terminal: `{ app: "terminal", params: {} }`
- Claude Code: `{ app: "claude", params: { sessionId: "..." } }`
- Adding a new app = one entry in `APP_REGISTRY` + optional `resolveArgs` function

### Claude Code session persistence

- When Claude Code is spawned via command palette, the PTY PID is tracked
- Poll `~/.claude/sessions/{pid}.json` every 2s (up to 30s) for session ID
- Once found, stored in `params.sessionId` on the pane
- On app restart, panes with `params.sessionId` spawn `claude --resume <id>`
- `resolveArgs` in app registry maps `params.sessionId` to `['--resume', sessionId]`

## Backend Targets

### Target resolution

- **Linux/macOS**: single `local` target (native shell)
- **Windows**: `WslTarget` per detected distro + `PowershellTarget`
- WSL distros auto-detected via `wsl.exe -l -q`
- Default target: first WSL distro on Windows, `local` otherwise

### Target behavior

- Each target defines: `getDefaultShell()`, `getDefaultShellArgs()`, `spawn()`, `getHomedir()`, `listDir()`
- **LocalTarget**: `$SHELL --login`, `os.homedir()`, `fs.readdir`
- **WslTarget**: `wsl.exe -d <distro> --cd <cwd> -- bash -l`, WSL homedir via `wsl.exe -e bash -c "echo $HOME"` (cached), dir listing via UNC path `\\wsl.localhost\<distro>\<path>`
- **PowershellTarget**: `powershell.exe -NoLogo`, Windows `os.homedir()`, native `fs.readdir`

## Persistence

### Save triggers

- On state change: debounced **1 second**
- Periodic autosave: every **60 seconds**
- On app close: immediate save via `beforeunload`

### Persisted state

- Version field for schema migration
- Active workspace number
- Per-workspace: layout tree (including tab nodes), focused pane ID, cwd, targetId
- Per-pane: app, params (including Claude sessionId), splitDirection, color
- **NOT persisted**: terminal scrollback, running processes

### Backward compatibility

- Zod schema uses `.optional().default('')` for newer fields (`cwd`, `targetId`)
- Store's `initialize()` fills defaults for missing workspace fields from old state

## UI/Design

### Focus border

- Rendered as an **absolutely positioned overlay div** with `z-index: 10` and `pointer-events: none`
- Inside the terminal overlay container (on top of xterm canvas)
- `1px solid var(--border-focus)` when focused

### Modifier key

- All app keybindings use **Alt** (not Super/Win — Windows intercepts it)
- `e.preventDefault()` on all Alt events prevents Electron menu bar activation

### Keybinding implementation

- Uses `e.code` (not `e.key`) — layout-independent, unaffected by Alt producing special characters
