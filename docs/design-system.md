# Boost Design System

## Color Palette

Apple-inspired dark mode with blue accents.

| Token              | Hex       | Usage                            |
| ------------------ | --------- | -------------------------------- |
| `--bg-primary`     | `#1c1c1e` | Main background                  |
| `--bg-secondary`   | `#2c2c2e` | Workspace bar, elevated surfaces |
| `--bg-tertiary`    | `#3a3a3c` | Hover states, subtle backgrounds |
| `--border`         | `#38383a` | Borders, split dividers          |
| `--border-focus`   | `#0a84ff` | Focus indicator                  |
| `--text-primary`   | `#f5f5f7` | Primary text                     |
| `--text-secondary` | `#98989d` | Muted/secondary text             |
| `--accent`         | `#0a84ff` | Active elements, links           |
| `--accent-hover`   | `#409cff` | Hover on accent elements         |

## Terminal Colors

| Color      | Normal                    | Bright    |
| ---------- | ------------------------- | --------- |
| Black      | `#1c1c1e`                 | `#48484a` |
| Red        | `#ff453a`                 | `#ff6961` |
| Green      | `#30d158`                 | `#4cd964` |
| Yellow     | `#ffd60a`                 | `#ffdc5c` |
| Blue       | `#0a84ff`                 | `#409cff` |
| Magenta    | `#bf5af2`                 | `#da8aff` |
| Cyan       | `#64d2ff`                 | `#70d7ff` |
| White      | `#f5f5f7`                 | `#ffffff` |
| Foreground | `#e5e5ea`                 |           |
| Background | `#1c1c1e`                 |           |
| Cursor     | `#0a84ff`                 |           |
| Selection  | `rgba(10, 132, 255, 0.3)` |           |

## Typography

### UI Font

```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
```

- Base size: `13px`
- Workspace buttons: `11px`, weight `500`

### Terminal Font

```
'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace
```

- Size: `13px`
- Line height: `1.35`
- Weights: Regular (400), Bold (700), plus italics
- Source: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) v2.304, self-hosted woff2

## Spacing

| Element               | Value                         |
| --------------------- | ----------------------------- |
| Terminal padding      | `4px`                         |
| Split divider         | `1px` visible, `7px` hit area |
| Workspace bar height  | `32px`                        |
| Workspace bar padding | `0 12px`                      |
| Workspace button      | `3px 10px`, radius `5px`      |
| Button gap            | `6px`                         |

## UI Components (shadcn/ui)

All UI components use shadcn/ui. Components live in `src/renderer/src/components/ui/`.

### Button

Variants: `default`, `secondary`, `ghost`, `workspace`, `workspaceActive`
Sizes: `default` (h-8), `sm` (h-7), `icon` (h-8 w-8)

### Input

Styled with CSS variables, mono font for path inputs.

### Command (Command Palette)

- Backdrop: `rgba(0, 0, 0, 0.5)`
- Container: `480px` wide, rounded-lg, border
- Items: hover highlight with `--bg-tertiary`
- Input: transparent background, placeholder in `--text-secondary`

## Component Styles

### Workspace Bar

- Background: `--bg-secondary`
- Top border: `1px solid --border`
- Active button: `rgba(10, 132, 255, 0.15)` fill, `--accent` text
- Inactive button: transparent, `--text-secondary` text
- Shows folder name from workspace cwd
- Shows focused pane's split direction indicator (⬌ or ⬍)

### Split Divider

- Visual: `1px` line in `--border` color
- Hit area: `7px` total (3px transparent border each side)
- Cursor: `col-resize` / `row-resize`

### Pane Focus

- Absolute overlay div with `z-index: 10` and `pointer-events: none`
- `1px solid --border-focus` when focused

### Workspace Setup

- Centered path input with homedir prefix
- Target selector tabs (shown only when multiple targets available)
- Tab autocomplete for directory names
- Browse button for native folder picker

## Keybindings

All use `Alt` as modifier. See [keybindings.md](keybindings.md) for full reference.
