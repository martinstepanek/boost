# Persistence

The app persists its state so that closing and reopening the app restores the exact layout, workspaces, and terminal positions the user left.

## What Is Persisted

| Data | Persisted? | Notes |
|---|---|---|
| Which workspaces exist | Yes | e.g., workspaces 1, 3, 5 are active |
| Active workspace | Yes | Which workspace was visible on close |
| Tiling layout per workspace | Yes | Full binary tree structure with split ratios |
| Pane positions and sizes | Yes | Derived from the tree + split ratios |
| Terminal working directory | Yes | `cwd` of each terminal at save time |
| Terminal scrollback/history | No | Too large; terminals start fresh |
| Running processes | No | Processes are re-launched from saved `cwd` |
| Backend target per pane | Yes | Target ID (e.g., `wsl:Ubuntu`, `local`) |

## How It Works

### Save Triggers

State is saved automatically on:
- **App close** - `before-quit` event in Electron main process
- **Layout change** - After any split, close, resize, or workspace switch (debounced, ~1s delay)
- **Periodic autosave** - Every 60 seconds as a safety net

### Storage Format

State is saved as JSON to the Electron `userData` directory:

```
%APPDATA%/tileterm/state.json
```

### State Schema

```json
{
  "version": 2,
  "defaultTarget": "wsl:Ubuntu",
  "activeWorkspace": 1,
  "workspaces": {
    "1": {
      "layout": {
        "type": "split",
        "direction": "horizontal",
        "ratio": 0.5,
        "children": [
          {
            "type": "pane",
            "id": "pane-abc123",
            "terminal": {
              "cwd": "/home/stepanek/project",
              "target": "wsl:Ubuntu"
            }
          },
          {
            "type": "pane",
            "id": "pane-def456",
            "terminal": {
              "cwd": "/home/stepanek",
              "target": "wsl:Ubuntu"
            }
          }
        ]
      },
      "focusedPaneId": "pane-abc123"
    },
    "3": {
      "layout": {
        "type": "pane",
        "id": "pane-ghi789",
        "terminal": {
          "cwd": "/home/stepanek/other-project",
          "target": "wsl:Ubuntu"
        }
      },
      "focusedPaneId": "pane-ghi789"
    }
  }
}
```

Note: The `target` field stores the BackendTarget ID. On restore, the app resolves this ID to a target instance via `TargetResolver`. If the target is unavailable (e.g., WSL distro was removed), the pane falls back to the `defaultTarget` or shows an error.

### Restore on Startup

When the app launches:

1. Read `state.json` from disk
2. Reconstruct workspace and layout trees in the Zustand store
3. For each pane, resolve the saved `target` ID to a BackendTarget, then spawn a PTY with the saved `cwd`
4. Render the active workspace
5. Restore focus to the previously focused pane

If `state.json` is missing or corrupt, the app starts with a single workspace containing one terminal pane (default state).

### Terminal Session Restoration

Terminal sessions cannot be fully restored (running processes, scrollback). Instead:

- A new shell is spawned in the same working directory
- The user sees a fresh shell prompt at the correct location
- Any previously running processes (e.g., a dev server) need to be manually restarted

This matches the behavior of most terminal apps (e.g., Windows Terminal, iTerm2 session restore).
