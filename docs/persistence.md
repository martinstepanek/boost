# Persistence

## What Is Persisted

| Data                   | Persisted | Notes                                         |
| ---------------------- | --------- | --------------------------------------------- |
| Which workspaces exist | Yes       | e.g., workspaces 1, 3, 5 are active           |
| Active workspace       | Yes       | Which workspace was visible on close          |
| Tiling layout          | Yes       | Full binary tree with split ratios            |
| Pane app type + params | Yes       | `app: "terminal"` or `app: "claude"` + params |
| Pane split direction   | Yes       | Per-pane i3-style split direction             |
| Workspace cwd          | Yes       | Working directory per workspace               |
| Workspace target       | Yes       | Backend target ID (local, wsl:Ubuntu, etc.)   |
| Claude session ID      | Yes       | In pane params for session resume             |
| Terminal scrollback    | No        | Too large; terminals start fresh              |
| Running processes      | No        | Processes re-launch from saved state          |

## Save Triggers

1. **On state change** — debounced 1 second after any layout/workspace change
2. **Periodic autosave** — every 60 seconds as a safety net
3. **On app close** — immediate save via `beforeunload`

## Storage

- **Path:** `{app.getPath('userData')}/tiling-state.json` (e.g., `~/.config/boost/tiling-state.json`)
- **Format:** JSON, pretty-printed

## State Schema

```json
{
  "version": 1,
  "activeWorkspace": 1,
  "workspaces": {
    "1": {
      "layout": {
        "type": "split",
        "id": "split-abc123",
        "direction": "horizontal",
        "ratio": 0.5,
        "children": [
          {
            "type": "pane",
            "id": "pane-def456",
            "color": "#1e3a5f",
            "app": "terminal",
            "params": {},
            "splitDirection": "horizontal"
          },
          {
            "type": "pane",
            "id": "pane-ghi789",
            "color": "#3b1f2b",
            "app": "claude",
            "params": { "sessionId": "b5977b9c-..." },
            "splitDirection": "vertical"
          }
        ]
      },
      "focusedPaneId": "pane-def456",
      "cwd": "/home/user/project",
      "targetId": "wsl:Ubuntu"
    }
  }
}
```

### PaneNode Fields

| Field            | Type                         | Description                               |
| ---------------- | ---------------------------- | ----------------------------------------- |
| `type`           | `"pane"`                     | Node type discriminator                   |
| `id`             | `string`                     | Unique pane ID (crypto UUID prefix)       |
| `color`          | `string`                     | Hex color for visual identification       |
| `app`            | `string`                     | App registry ID: `"terminal"`, `"claude"` |
| `params`         | `Record<string, unknown>`    | App-specific data (e.g., `sessionId`)     |
| `splitDirection` | `"horizontal" \| "vertical"` | Next split direction for this pane (i3)   |

### WorkspaceState Fields

| Field           | Type                 | Description                         |
| --------------- | -------------------- | ----------------------------------- |
| `layout`        | `TilingNode \| null` | Tiling tree (null = no terminals)   |
| `focusedPaneId` | `string`             | Focused pane in this workspace      |
| `cwd`           | `string`             | Working directory                   |
| `targetId`      | `string`             | Backend target (local, wsl:X, etc.) |

## Restore on Startup

1. Read `tiling-state.json` from disk
2. Validate version field and workspace structure
3. Apply defaults for missing fields (backward compatibility)
4. Populate Zustand store
5. Render active workspace
6. For each pane, spawn PTY (shell or command based on `app` field)
7. For Claude panes with `params.sessionId`, resume session
8. If state missing or corrupt, start with empty workspace 1

## Backward Compatibility

The Zod schema uses `.optional().default('')` for newer fields (`cwd`, `targetId`). The store's `initialize` function fills in defaults for any missing workspace fields, so old state files load without errors.
