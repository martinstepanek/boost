# Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                 Electron App (Windows)           │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │          Renderer Process (React)         │   │
│  │                                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │  │Workspace│ │Workspace│ │Workspace│ ... │   │
│  │  │    1    │ │    2    │ │    3    │     │   │
│  │  └────┬────┘ └─────────┘ └─────────┘     │   │
│  │       │                                   │   │
│  │  ┌────▼──────────────────────┐            │   │
│  │  │    Tiling Layout Engine   │            │   │
│  │  │    (Binary Split Tree)    │            │   │
│  │  └────┬──────────┬──────────┘            │   │
│  │       │          │                        │   │
│  │  ┌────▼────┐ ┌───▼─────┐                 │   │
│  │  │Terminal │ │Terminal │  (xterm.js)      │   │
│  │  │ Pane 1  │ │ Pane 2  │                  │   │
│  │  └────┬────┘ └───┬─────┘                 │   │
│  └───────│──────────│────────────────────────┘   │
│          │   IPC    │                            │
│  ┌───────▼──────────▼────────────────────────┐   │
│  │          Main Process (Node.js)           │   │
│  │                                           │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │         PTY Manager              │     │   │
│  │  │   (target-agnostic PTY control)  │     │   │
│  │  └──────────────┬───────────────────┘     │   │
│  │                 │                         │   │
│  │  ┌──────────────▼───────────────────┐     │   │
│  │  │      Backend Target Layer        │     │   │
│  │  │  ┌───────┐ ┌───────┐ ┌────────┐  │     │   │
│  │  │  │ local │ │ wsl:* │ │ ssh:*  │  │     │   │
│  │  │  └───┬───┘ └───┬───┘ └───┬────┘  │     │   │
│  │  │      │         │         │        │     │   │
│  │  │  Handles: shell spawning, path   │     │   │
│  │  │  semantics, env, capabilities    │     │   │
│  │  └──────────────────────────────────┘     │   │
│  │                 │                         │   │
│  │  ┌──────────────▼───────────────────┐     │   │
│  │  │      Persistence Layer           │     │   │
│  │  │   (State save/restore)           │     │   │
│  │  └──────────────────────────────────┘     │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                     │
                     │ Target spawns shell
                     ▼
     ┌───────────┐  ┌───────────┐  ┌───────────┐
     │   Local   │  │    WSL    │  │    SSH    │
     │   Shell   │  │   Shell   │  │  (future) │
     └───────────┘  └───────────┘  └───────────┘
```

## Process Model

### Main Process (Electron main)
- Window creation and lifecycle
- PTY process management (target-agnostic — delegates to BackendTarget)
- Backend target resolution (local, WSL, future SSH)
- State persistence (save/load layout to disk)
- IPC handler between renderer and PTY processes
- System tray / native OS integration

### Renderer Process (React)
- UI rendering with React
- Tiling layout engine (manages the binary split tree)
- Workspace management
- xterm.js terminal rendering
- Keybinding handling
- State management (Zustand)

## Component Breakdown

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # App entry, BrowserWindow creation
│   ├── ipc-handlers.ts      # IPC channel handlers
│   ├── pty-manager.ts       # PTY lifecycle (spawn, resize, kill) — target-agnostic
│   ├── persistence.ts       # Save/load state to disk
│   ├── targets/
│   │   ├── backend-target.ts    # BackendTarget interface
│   │   ├── local-target.ts      # Local shell target (Linux/macOS)
│   │   ├── wsl-target.ts        # WSL target (distro detection, shell spawning)
│   │   └── target-resolver.ts   # Auto-detect and select the right target

│
├── renderer/                # React renderer process
│   ├── App.tsx              # Root component
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TilingContainer.tsx   # Recursive split container
│   │   │   ├── SplitHandle.tsx       # Draggable resize handle
│   │   │   └── Pane.tsx              # Leaf pane wrapper
│   │   ├── terminal/
│   │   │   └── TerminalPane.tsx      # xterm.js instance
│   │   ├── workspace/
│   │   │   ├── WorkspaceBar.tsx      # Workspace indicator/switcher
│   │   │   └── WorkspaceView.tsx     # Active workspace renderer
│   │   └── ui/
│   │       └── StatusBar.tsx         # Bottom status bar
│   ├── hooks/
│   │   ├── useKeybindings.ts         # Global keybinding handler
│   │   ├── useWorkspace.ts           # Workspace switching logic
│   │   └── usePty.ts                 # PTY IPC communication
│   ├── store/
│   │   ├── layout-store.ts           # Tiling tree state (Zustand)
│   │   ├── workspace-store.ts        # Workspace state
│   │   └── config-store.ts           # User preferences
│   └── lib/
│       ├── tiling-tree.ts            # Binary tree data structure + operations
│       └── types.ts                  # Shared type definitions
│
├── shared/
│   └── ipc-channels.ts              # IPC channel name constants
│
└── config/
    └── default-keybindings.json      # Default key mappings
```

## Data Flow

1. **User presses a key** → keybinding handler in renderer
2. **Keybinding triggers action** (e.g., split, focus, workspace switch) → updates Zustand store
3. **Store change triggers re-render** → tiling layout recalculates, panes resize
4. **Terminal needs PTY** → renderer sends IPC to main process
5. **PTY manager delegates to BackendTarget** → target handles shell spawning (local, WSL, etc.)
6. **Target spawns shell** via node-pty → streams data back over IPC
7. **xterm.js renders** the PTY output in the terminal pane
8. **On state change** → persistence layer serializes layout to disk
