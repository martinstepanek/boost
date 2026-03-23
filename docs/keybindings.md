# Keybindings

All keybindings use `Alt` as the modifier key. Keybindings are currently hardcoded in `src/renderer/src/hooks/use-keybindings.ts` using `e.code` for layout independence.

## Implemented Keybindings

### Workspace Management

| Keybinding                          | Action                             |
| ----------------------------------- | ---------------------------------- |
| `Alt+1` through `Alt+9`             | Switch to workspace 1–9            |
| `Alt+Shift+1` through `Alt+Shift+9` | Move focused pane to workspace 1–9 |

### Pane Split Direction (per-pane, i3-style)

| Keybinding | Action                                           |
| ---------- | ------------------------------------------------ |
| `Alt+B`    | Set focused pane's next split to horizontal (←→) |
| `Alt+V`    | Set focused pane's next split to vertical (↑↓)   |

Each pane remembers its own split direction. Alt+B/V only affects the focused pane.

### Pane Creation & Destruction

| Keybinding    | Action                                                 |
| ------------- | ------------------------------------------------------ |
| `Alt+Enter`   | Open new terminal using focused pane's split direction |
| `Alt+Shift+Q` | Close focused pane                                     |

### Focus Navigation

| Keybinding  | Action                  |
| ----------- | ----------------------- |
| `Alt+H`     | Focus pane to the left  |
| `Alt+J`     | Focus pane below        |
| `Alt+K`     | Focus pane above        |
| `Alt+L`     | Focus pane to the right |
| `Alt+Arrow` | Focus pane in direction |

### Pane Movement

| Keybinding        | Action                      |
| ----------------- | --------------------------- |
| `Alt+Shift+H`     | Move/swap pane left         |
| `Alt+Shift+J`     | Move/swap pane down         |
| `Alt+Shift+K`     | Move/swap pane up           |
| `Alt+Shift+L`     | Move/swap pane right        |
| `Alt+Shift+Arrow` | Move/swap pane in direction |

Move changes the parent split's direction to match the movement axis. If already in position, swaps with neighbor.

### Command Palette

| Keybinding | Action                |
| ---------- | --------------------- |
| `Alt+D`    | Open command palette  |
| `Escape`   | Close command palette |

The command palette lists available apps (Terminal, Claude Code). Select one to open it in a new pane.

### Terminal

| Keybinding              | Action                                    |
| ----------------------- | ----------------------------------------- |
| `Ctrl+C` (w/ selection) | Copy selected text to clipboard           |
| `Ctrl+C` (no selection) | Send SIGINT to terminal (normal behavior) |
| `Ctrl+V`                | Paste from clipboard                      |

### Resize

Split dividers can be dragged with the mouse.

## Key Handling Architecture

1. `Alt` key events are intercepted at the capture phase (`window.addEventListener('keydown', handler, true)`)
2. `e.preventDefault()` on all Alt events prevents Electron menu bar activation
3. xterm.js blocks all `Alt+key` via `attachCustomKeyEventHandler` — they never reach the terminal
4. Non-Alt keypresses pass through to the focused terminal

## Planned

- Configurable keybindings via JSON config
- Resize mode (`Alt+R` + `H/J/K/L`)
- Fullscreen toggle (`Alt+F`)
