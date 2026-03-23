# Boost Design System

## Color Palette

Apple-inspired dark mode with blue accents.

| Token              | Hex         | Usage                              |
| ------------------ | ----------- | ---------------------------------- |
| `--bg-primary`     | `#1c1c1e`   | Main background                    |
| `--bg-secondary`   | `#2c2c2e`   | Workspace bar, elevated surfaces   |
| `--bg-tertiary`    | `#3a3a3c`   | Hover states, subtle backgrounds   |
| `--border`         | `#38383a`   | Borders, split dividers            |
| `--border-focus`   | `#0a84ff`   | Focus indicator                    |
| `--text-primary`   | `#f5f5f7`   | Primary text                       |
| `--text-secondary` | `#98989d`   | Muted/secondary text               |
| `--accent`         | `#0a84ff`   | Active elements, links             |
| `--accent-hover`   | `#409cff`   | Hover on accent elements           |

## Terminal Colors

| Color          | Normal    | Bright    |
| -------------- | --------- | --------- |
| Black          | `#1c1c1e` | `#48484a` |
| Red            | `#ff453a` | `#ff6961` |
| Green          | `#30d158` | `#4cd964` |
| Yellow         | `#ffd60a` | `#ffdc5c` |
| Blue           | `#0a84ff` | `#409cff` |
| Magenta        | `#bf5af2` | `#da8aff` |
| Cyan           | `#64d2ff` | `#70d7ff` |
| White          | `#f5f5f7` | `#ffffff` |
| Foreground     | `#e5e5ea` |           |
| Background     | `#1c1c1e` |           |
| Cursor         | `#0a84ff` |           |
| Selection      | `rgba(10, 132, 255, 0.3)` | |

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

| Element             | Value  |
| ------------------- | ------ |
| Terminal padding     | `4px`  |
| Pane focus border    | `1px`  |
| Split divider        | `1px` visible, `7px` hit area |
| Workspace bar height | `32px` |
| Workspace bar padding| `0 12px` |
| Workspace button     | `3px 10px`, radius `5px` |
| Button gap           | `6px`  |

## Component Styles

### Workspace Bar

- Background: `--bg-secondary`
- Top border: `1px solid --border`
- Active button: `rgba(10, 132, 255, 0.15)` fill, `--accent` text
- Inactive button: transparent, `--text-secondary` text
- Hover: `--bg-tertiary` fill, `--text-primary` text

### Split Divider

- Visual: `1px` line in `--border` color
- Hit area: `7px` total (3px transparent border each side)
- Cursor: `col-resize` (horizontal) / `row-resize` (vertical)

### Pane Focus

- Focused: `1px solid --border-focus`
- Unfocused: `1px solid transparent`

## Keybindings

All use `Alt` as modifier.

| Shortcut               | Action                          |
| ---------------------- | ------------------------------- |
| `Alt+B`                | Split horizontal (left/right)   |
| `Alt+V`                | Split vertical (top/bottom)     |
| `Alt+Shift+Q`          | Close focused pane              |
| `Alt+H/J/K/L`          | Focus left/down/up/right        |
| `Alt+Arrows`           | Focus left/down/up/right        |
| `Alt+Shift+H/J/K/L`   | Move pane in direction          |
| `Alt+Shift+Arrows`     | Move pane in direction          |
| `Alt+1-9`              | Switch to workspace             |
| `Alt+Shift+1-9`        | Move pane to workspace          |
| `Ctrl+C` (w/ selection)| Copy to clipboard               |
| `Ctrl+V`               | Paste from clipboard            |
