# Boost — Project Conventions

## Overview

Boost is a tiling terminal emulator (Electron + React + TypeScript) with i3-style window management.

## Tech Stack

- **Electron** (main process) + **React 19** (renderer) + **TypeScript**
- **xterm.js** + **node-pty** for terminal emulation
- **tRPC** over Electron IPC for type-safe communication
- **Zustand** for state management
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **shadcn/ui** for UI components
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

## Code Conventions

- All hardcoded values (colors, sizes, timing) go in `src/shared/constants.ts`
- Shared types in `src/shared/types.ts`
- Tiling tree logic (pure functions) in `src/renderer/src/lib/tiling-tree.ts`
- PTY tracking in `src/renderer/src/lib/pty-registry.ts`
- Single Zustand store in `src/renderer/src/stores/tiling-store.ts`

## Keybindings

All use `Alt` as modifier. Hardcoded in `src/renderer/src/hooks/use-keybindings.ts`.
Use `e.code` (not `e.key`) for keyboard handling — it's layout-independent.

## Node Version

Requires Node.js 22+ (pinned via `.nvmrc`). Use `nvm use` before running commands.

## Commands

```bash
yarn run dev        # Start development
yarn run build      # Production build
yarn run typecheck  # Type checking
yarn run lint       # ESLint
yarn run format     # Prettier
```
