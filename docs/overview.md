# Overview

## What is Boost?

Boost is a desktop terminal application with i3-like tiling window management. It runs as an Electron app with terminal sessions powered by node-pty and rendered with xterm.js.

## Core Goals

1. **i3-style tiling** — binary tree splits, keyboard-driven focus and movement, no floating windows
2. **Workspaces** — numbered virtual desktops 1–9, switchable with `Alt+1` through `Alt+9`
3. **Multiple terminals per workspace** — split any workspace into as many terminal panes as needed
4. **Persistence** — layout, workspaces, and focus survive app restarts
5. **Keyboard-first** — every action accessible via keybindings

## Scope

### Implemented

- Terminal panes with xterm.js + node-pty
- Binary split tree tiling layout
- 9 workspaces with independent layouts
- State persistence to JSON
- Focus navigation and pane movement
- Drag-to-resize split handles
- Copy/paste support
- Apple-inspired dark theme with JetBrains Mono

### Future

- WSL integration (BackendTarget abstraction)
- Embedded web browser tabs as panes
- Configurable keybindings
- Multi-monitor workspace assignment

## Design Principles

- **Keyboard-driven** — mouse is supported but never required
- **Fast** — instant workspace switching, terminals persist across switches
- **Minimal chrome** — maximum screen real estate for terminal content
- **Predictable** — tiling behavior follows i3 conventions
