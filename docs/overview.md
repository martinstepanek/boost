# Overview

## What is Boost?

Boost is a desktop terminal application with i3-like tiling window management. It runs as an Electron app with terminal sessions powered by node-pty and rendered with xterm.js.

## Core Goals

1. **i3-style tiling** — binary tree splits, per-pane split direction, keyboard-driven focus and movement
2. **Workspaces** — numbered virtual desktops 1–9, switchable with `Alt+1` through `Alt+9`
3. **Multiple terminals per workspace** — split any workspace into as many terminal panes as needed
4. **Backend targets** — WSL, PowerShell (Windows), native shell (Linux/macOS)
5. **Persistence** — layout, workspaces, targets, and focus survive app restarts
6. **Keyboard-first** — every action accessible via keybindings
7. **Extensible apps** — command palette for launching Terminal, Claude Code, and future apps

## Implemented Features

- i3-style binary split tree tiling (per-pane split direction, 50/50 splits)
- 9 workspaces with independent layouts and configurable working directories
- Backend target abstraction: LocalTarget, WslTarget, PowershellTarget
- Terminal emulation with xterm.js + node-pty
- Command palette (`Alt+D`) with extensible app registry
- Claude Code integration with session persistence
- Tab autocomplete for workspace path input
- State persistence to JSON (debounced saves + autosave)
- Apple-inspired dark theme with JetBrains Mono
- shadcn/ui component library
- Copy/paste, drag-to-resize, focus navigation

## Future

- Configurable keybindings
- Resize mode (`Alt+R`)
- Fullscreen toggle (`Alt+F`)
- Embedded web browser tabs as panes
- Multi-monitor workspace assignment
- SSH backend target

## Design Principles

- **Keyboard-driven** — mouse is supported but never required
- **Fast** — instant workspace switching, terminals persist across switches
- **Minimal chrome** — maximum screen real estate for terminal content
- **Predictable** — tiling behavior follows i3 conventions
