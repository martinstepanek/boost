# Keybindings

All keybindings use `Alt` as the modifier key. Keybindings are currently hardcoded (configurable keybindings planned for a future release).

## Implemented Keybindings

### Workspace Management

| Keybinding                          | Action                             |
| ----------------------------------- | ---------------------------------- |
| `Alt+1` through `Alt+9`             | Switch to workspace 1–9            |
| `Alt+Shift+1` through `Alt+Shift+9` | Move focused pane to workspace 1–9 |

### Pane Creation & Destruction

| Keybinding    | Action                                       |
| ------------- | -------------------------------------------- |
| `Alt+V`       | Split focused pane vertically (top/bottom)   |
| `Alt+B`       | Split focused pane horizontally (left/right) |
| `Alt+Shift+Q` | Close focused pane                           |

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

Move changes the parent split's direction to match the movement axis and repositions the pane. If already in the correct position, it swaps with the neighbor.

### Terminal

| Keybinding              | Action                                    |
| ----------------------- | ----------------------------------------- |
| `Ctrl+C` (w/ selection) | Copy selected text to clipboard           |
| `Ctrl+C` (no selection) | Send SIGINT to terminal (normal behavior) |
| `Ctrl+V`                | Paste from clipboard                      |

### Resize

Split dividers can be dragged with the mouse to resize panes.

## Key Handling Architecture

### Keybinding Priority

1. App-level keybindings (`Alt+*` combinations) are captured first via a `keydown` listener on the capture phase
2. xterm.js blocks all `Alt+key` events from reaching the terminal via `attachCustomKeyEventHandler`
3. If no app keybinding matches, the keypress is forwarded to the focused terminal

This means `Alt+H` is captured by the app (focus left), but plain `H` goes to the terminal.

## Planned Features

- Configurable keybindings via JSON config file
- Resize mode (`Alt+R` + `H/J/K/L`)
- Fullscreen toggle (`Alt+F`)
