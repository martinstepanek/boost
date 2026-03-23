# Overview

## What is TileTerm?

TileTerm is a desktop terminal application with i3-like tiling window management. It runs on Windows as an Electron app and connects to WSL for shell sessions.

## Core Goals

1. **i3-style tiling** - Binary tree splits, keyboard-driven focus and movement, no floating windows
2. **Workspaces** - Numbered virtual desktops switchable with `Win+1` through `Win+9`
3. **Multiple terminals per workspace** - Split any workspace into as many terminal panes as needed
4. **WSL-native terminals** - App runs on Windows, all terminal sessions run inside WSL
5. **Persistence** - Layout, workspaces, and open terminals survive app restarts
6. **Keyboard-first** - Every action accessible via configurable keybindings

## Scope

### Phase 1 (Current)
- Terminal panes only (no browser tabs)
- Workspaces with tiling layout
- WSL shell support
- State persistence

### Future
- Embedded web browser tabs as panes (Electron webview)
- Tabbed browsing within panes
- Multi-monitor workspace assignment

## Design Principles

- **Keyboard-driven** - Mouse is supported but never required
- **Fast** - Instant workspace switching, fast terminal rendering
- **Minimal chrome** - Maximum screen real estate for terminal content
- **Predictable** - Tiling behavior follows i3 conventions so existing i3 users feel at home
