# Keybindings

All keybindings use `Win` (Super) as the modifier key, matching i3wm conventions.

## Default Keybindings

### Workspace Management

| Keybinding                          | Action                             |
| ----------------------------------- | ---------------------------------- |
| `Win+1` through `Win+9`             | Switch to workspace 1-9            |
| `Win+Shift+1` through `Win+Shift+9` | Move focused pane to workspace 1-9 |

### Pane Creation & Destruction

| Keybinding    | Action                                       |
| ------------- | -------------------------------------------- |
| `Win+Enter`   | Open new terminal in current workspace       |
| `Win+V`       | Split focused pane vertically (top/bottom)   |
| `Win+B`       | Split focused pane horizontally (left/right) |
| `Win+Shift+Q` | Close focused pane                           |

### Focus Navigation

| Keybinding | Action                  |
| ---------- | ----------------------- |
| `Win+H`    | Focus pane to the left  |
| `Win+J`    | Focus pane below        |
| `Win+K`    | Focus pane above        |
| `Win+L`    | Focus pane to the right |

### Pane Movement

| Keybinding    | Action          |
| ------------- | --------------- |
| `Win+Shift+H` | Move pane left  |
| `Win+Shift+J` | Move pane down  |
| `Win+Shift+K` | Move pane up    |
| `Win+Shift+L` | Move pane right |

### Resize

| Keybinding                 | Action                   |
| -------------------------- | ------------------------ |
| `Win+R`                    | Enter resize mode        |
| `H/J/K/L` (in resize mode) | Shrink/grow in direction |
| `Escape` or `Enter`        | Exit resize mode         |

### Layout

| Keybinding | Action                             |
| ---------- | ---------------------------------- |
| `Win+F`    | Toggle fullscreen for focused pane |

### Terminal

| Keybinding     | Action         |
| -------------- | -------------- |
| `Ctrl+Shift+C` | Copy selection |
| `Ctrl+Shift+V` | Paste          |

## Key Handling Architecture

The `Win` key presents a challenge on Windows because the OS intercepts it for the Start menu. Solutions:

1. **Register global shortcuts** via Electron's `globalShortcut` API - intercepts before the OS handles them
2. **Use a different modifier** as a fallback (e.g., `Alt`) if global shortcuts can't be registered
3. **Allow the user to configure the modifier key** in settings

### Keybinding Priority

1. App-level keybindings (workspace switching, pane management) take priority
2. If no app keybinding matches, the keypress is forwarded to the focused terminal
3. Terminal handles the keypress (e.g., `Ctrl+C` goes to the shell)

This means `Win+H` is captured by the app (focus left), but plain `H` goes to the terminal.

## Configuration

Keybindings are configurable via a JSON file:

```json
// config/keybindings.json
{
  "mod": "Super",
  "bindings": {
    "mod+Enter": "terminal:new",
    "mod+v": "layout:split-vertical",
    "mod+b": "layout:split-horizontal",
    "mod+h": "focus:left",
    "mod+j": "focus:down",
    "mod+k": "focus:up",
    "mod+l": "focus:right",
    "mod+Shift+h": "move:left",
    "mod+Shift+j": "move:down",
    "mod+Shift+k": "move:up",
    "mod+Shift+l": "move:right",
    "mod+Shift+q": "pane:close",
    "mod+f": "pane:fullscreen",
    "mod+r": "mode:resize",
    "mod+1": "workspace:1",
    "mod+2": "workspace:2",
    "mod+3": "workspace:3",
    "mod+4": "workspace:4",
    "mod+5": "workspace:5",
    "mod+6": "workspace:6",
    "mod+7": "workspace:7",
    "mod+8": "workspace:8",
    "mod+9": "workspace:9",
    "mod+Shift+1": "move-to-workspace:1",
    "mod+Shift+2": "move-to-workspace:2",
    "mod+Shift+3": "move-to-workspace:3",
    "mod+Shift+4": "move-to-workspace:4",
    "mod+Shift+5": "move-to-workspace:5",
    "mod+Shift+6": "move-to-workspace:6",
    "mod+Shift+7": "move-to-workspace:7",
    "mod+Shift+8": "move-to-workspace:8",
    "mod+Shift+9": "move-to-workspace:9"
  }
}
```
