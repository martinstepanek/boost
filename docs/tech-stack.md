# Tech Stack & Setup

## Technology Choices

| Layer | Technology | Why |
|---|---|---|
| App framework | **Electron** | Desktop app with native OS access (PTY, global shortcuts) |
| Frontend framework | **React + TypeScript** | Component-based UI, strong ecosystem |
| Project scaffolding | **create-t3-app** | Opinionated full-stack setup with TypeScript, provides solid boilerplate |
| Terminal rendering | **xterm.js** | Industry standard (used by VS Code, Hyper, Tabby) |
| Shell process mgmt | **node-pty** | PTY bindings for Node.js, required for real terminal emulation |
| State management | **Zustand** | Lightweight, no boilerplate, works well with React |
| Styling | **Tailwind CSS** (via T3) | Utility-first, fast iteration |
| Persistence | **JSON file** (electron userData) | Simple, no database needed for layout state |

## Project Setup with T3

The project uses [create-t3-app](https://create.t3.gg/) as the foundation. T3 gives us:

- TypeScript configured out of the box
- Tailwind CSS
- tRPC (useful for type-safe IPC between main and renderer)
- ESLint + Prettier

### Adapting T3 for Electron

T3 is designed for Next.js web apps. To use it with Electron, the setup requires adaptation:

1. **Scaffold the T3 app** as the renderer source
2. **Add Electron as the app shell** wrapping the React app
3. **Replace Next.js routing** with client-side React Router or simple state-based views (workspaces handle "routing")
4. **Use tRPC over IPC** instead of HTTP - main process acts as the tRPC server, renderer is the client
5. **Configure the build** so that Vite/webpack bundles the renderer and Electron packages the whole app

### tRPC over Electron IPC

T3's tRPC setup can be adapted for Electron IPC, giving type-safe communication between renderer and main process:

```
Renderer (tRPC client)  ──IPC──▶  Main Process (tRPC server)
     │                                    │
     │ pty.spawn(...)                     │ node-pty
     │ pty.resize(...)                    │ state persistence
     │ workspace.save(...)                │ WSL detection
```

This gives us end-to-end type safety from React components to the PTY manager.

## Key Dependencies

```json
{
  "dependencies": {
    "electron": "^29.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "xterm": "^5.x",
    "@xterm/addon-fit": "^0.10.x",
    "@xterm/addon-webgl": "^0.18.x",
    "node-pty": "^1.x",
    "zustand": "^4.x",
    "@trpc/server": "^10.x",
    "@trpc/client": "^10.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "electron-builder": "^24.x",
    "vite": "^5.x"
  }
}
```

## Build & Distribution

- **Development**: `electron-vite` or `vite` for hot-reload during development
- **Production build**: `electron-builder` packages the app as a Windows installer (.exe / .msi)
- **Auto-updates**: Electron's `autoUpdater` for future update delivery

## Development Workflow

```bash
# Install dependencies
npm install

# Run in development (hot-reload)
npm run dev

# Build for production
npm run build

# Package as Windows installer
npm run package
```
