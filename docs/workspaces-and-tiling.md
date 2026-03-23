# Workspaces & Tiling

## Workspaces

Workspaces are numbered virtual desktops, inspired by i3wm. Only one workspace is visible at a time. Each workspace maintains its own independent tiling layout.

### Workspace Behavior

- **Numbered 1-9** - Switched via `Win+1` through `Win+9`
- **Created on demand** - Workspace 3 doesn't exist until you switch to it
- **Destroyed when empty** - If all panes in a workspace are closed, the workspace is removed
- **Independent layouts** - Each workspace has its own tiling tree
- **Persistent** - Workspace state (which workspaces exist, their layouts) is saved to disk

### Workspace Switching

| Action                           | Keybinding          |
| -------------------------------- | ------------------- |
| Switch to workspace N            | `Win+N` (1-9)       |
| Move focused pane to workspace N | `Win+Shift+N` (1-9) |

When switching workspaces:

1. Current workspace's layout is preserved in memory
2. Target workspace's layout is rendered
3. Focus is restored to whichever pane was last focused in the target workspace
4. Terminal sessions continue running in background workspaces

## Tiling Layout Engine

The layout engine uses a **binary split tree**, the same model i3wm uses.

### Tree Structure

```
         Split(H)              ← horizontal split container
        /        \
    Terminal1   Split(V)       ← vertical split container
               /      \
          Terminal2  Terminal3
```

Every node is either:

- **Split Container** - has a direction (horizontal/vertical), a split ratio, and exactly two children
- **Leaf (Pane)** - contains a terminal (or in the future, a browser tab)

### Operations

#### Split

Divides the currently focused pane into two. The focused pane becomes a split container with the original content in one child and a new terminal in the other.

```
Before:                After Win+V (vertical split):
┌──────────┐          ┌──────────┐
│          │          │   Pane   │
│   Pane   │   →      ├──────────┤
│          │          │ New Pane │
└──────────┘          └──────────┘
```

| Action           | Keybinding |
| ---------------- | ---------- |
| Split vertical   | `Win+V`    |
| Split horizontal | `Win+B`    |

#### Focus Navigation

Move focus between panes using directional keys.

| Action      | Keybinding |
| ----------- | ---------- |
| Focus left  | `Win+H`    |
| Focus down  | `Win+J`    |
| Focus up    | `Win+K`    |
| Focus right | `Win+L`    |

Focus navigation walks the tree to find the geometrically nearest pane in the given direction.

#### Move Pane

Swap the focused pane's position in the layout.

| Action     | Keybinding    |
| ---------- | ------------- |
| Move left  | `Win+Shift+H` |
| Move down  | `Win+Shift+J` |
| Move up    | `Win+Shift+K` |
| Move right | `Win+Shift+L` |

#### Resize

| Action                  | Keybinding          |
| ----------------------- | ------------------- |
| Enter resize mode       | `Win+R`             |
| Resize (in resize mode) | `H/J/K/L`           |
| Exit resize mode        | `Escape` or `Enter` |

Resize can also be done by dragging split handles with the mouse.

#### Other Actions

| Action             | Keybinding    |
| ------------------ | ------------- |
| New terminal       | `Win+Enter`   |
| Close focused pane | `Win+Shift+Q` |
| Toggle fullscreen  | `Win+F`       |

### Layout Examples

**Single pane (default new workspace):**

```
┌────────────────────────┐
│                        │
│       Terminal 1       │
│                        │
└────────────────────────┘
```

**Two horizontal splits + one vertical:**

```
┌───────────┬────────────┐
│           │            │
│ Terminal 1│ Terminal 2  │
│           │            │
│           ├────────────┤
│           │            │
│           │ Terminal 3  │
│           │            │
└───────────┴────────────┘
```

**Complex workspace:**

```
┌──────┬──────┬──────────┐
│      │      │          │
│  T1  │  T2  │          │
│      │      │   T4     │
├──────┴──────┤          │
│             │          │
│     T3      │          │
│             │          │
└─────────────┴──────────┘
```
