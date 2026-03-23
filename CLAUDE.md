# Boost — Project Conventions

## Overview

Boost is a tiling terminal emulator (Electron + React + TypeScript) with i3-style window management.

## Tech Stack

- **Electron** (main process) + **React 19** (renderer) + **TypeScript**
- **xterm.js** + **node-pty** for terminal emulation
- **tRPC** over Electron IPC for type-safe communication
- **Zustand** for state management
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **shadcn/ui** for UI components (Button, Input, Command)
- **cmdk** for command palette
- **electron-vite** for build tooling
- **yarn** as package manager (not npm)

## UI Components

- **Always use shadcn/ui** for buttons, inputs, and other UI elements
- Components live in `src/renderer/src/components/ui/`
- Use the `cn()` utility from `src/renderer/src/lib/utils.ts` for class merging
- Prefer Tailwind classes over inline styles
- Reference design tokens via CSS variables (see `src/renderer/src/assets/main.css`)

## Design System

See [docs/design-system.md](docs/design-system.md) for the full specification:

- Apple-inspired dark mode palette
- JetBrains Mono for terminal, system font for UI
- CSS variables: `--bg-primary`, `--bg-secondary`, `--accent`, `--border`, etc.

## Architecture

- **Backend targets**: `src/main/targets/` — LocalTarget, WslTarget, PowershellTarget
- **App registry**: `src/shared/app-registry.ts` — extensible app definitions (Terminal, Claude Code)
- **Tiling tree**: `src/renderer/src/lib/tiling-tree.ts` — pure functions, i3-style binary splits
- **PTY registry**: `src/renderer/src/lib/pty-registry.ts` — tracks active PTYs and fit addons
- **Pane rect store**: `src/renderer/src/lib/pane-rect-store.ts` — tracks pane DOM positions
- **Store**: `src/renderer/src/stores/tiling-store.ts` — single Zustand store for all state
- **Constants**: `src/shared/constants.ts` — all hardcoded values
- **Types**: `src/shared/types.ts` — PaneNode, SplitNode, WorkspaceState, etc.

## Code Conventions

- All hardcoded values (colors, sizes, timing) go in `src/shared/constants.ts`
- New apps → add to `src/shared/app-registry.ts` (extensible array pattern)
- New backend targets → implement `BackendTarget` interface in `src/main/targets/`
- i3-style tiling: per-pane split direction, 50/50 splits, no rebalancing

## Keybindings

All use `Alt` as modifier. Hardcoded in `src/renderer/src/hooks/use-keybindings.ts`.
Use `e.code` (not `e.key`) for keyboard handling — it's layout-independent.
Key bindings: Alt+B/V (split direction), Alt+Enter (new pane), Alt+D (command palette),
Alt+H/J/K/L (focus), Alt+Shift+H/J/K/L (move), Alt+1-9 (workspace), Alt+Shift+Q (close).

## Node Version

Requires Node.js 22+ (pinned via `.nvmrc`). Use `nvm use` before running commands.

## Behavioral Spec

When making a specific behavioral decision (how a feature should work, edge case handling, interaction behavior), **always update `docs/behavioral-spec.md`** with the decision. This document serves as the source of truth for expected behavior and future tests.

## Git

- Do NOT push tags unless explicitly asked. Tags trigger CI builds.
- Push to main is fine for regular commits.

## Commands

```bash
yarn run dev        # Start development
yarn run build      # Production build
yarn run typecheck  # Type checking
yarn run lint       # ESLint
yarn run format     # Prettier
```
