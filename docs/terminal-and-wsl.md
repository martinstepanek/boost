# Terminal & Backend Targets

## Terminal Rendering

Each terminal pane uses **xterm.js** to render a fully featured terminal emulator in the browser (Electron renderer process).

### xterm.js Setup Per Pane

- Each pane creates its own `Terminal` instance
- Uses the **fit addon** to automatically size to the pane dimensions
- Uses the **webgl addon** for GPU-accelerated rendering (falls back to canvas)
- Connects to a PTY process in the main process via IPC

### Terminal Features

- Full VT100/xterm escape sequence support
- 256 color and true color support
- Mouse event passthrough (for vim, tmux, etc.)
- Scrollback buffer (configurable size)
- Copy/paste (`Ctrl+Shift+C` / `Ctrl+Shift+V`)
- Configurable font family, size, and line height
- Theming support (colors, cursor style)

## Backend Target Abstraction

Instead of treating WSL as a special case with scattered conditionals, the app uses a **BackendTarget** abstraction. The PTY manager and renderer never know or care where the shell runs — they talk to a target interface.

This pattern is validated by VS Code Remote, code-server, and devcontainers, all of which separate "local UI" from "remote execution."

### BackendTarget Interface

```typescript
interface BackendTarget {
  /** Unique identifier, e.g. "local", "wsl:Ubuntu", "ssh:myserver" */
  id: string

  /** Human-readable label for UI */
  label: string

  /** Spawn a shell process, returns a PTY handle */
  spawn(options: SpawnOptions): PtyHandle

  /** Resolve a path in target-native format */
  resolvePath(path: string): string

  /** Get the default working directory */
  defaultCwd(): string

  /** Get environment variables for the target */
  getEnv(): Record<string, string>

  /** Check if the target is available and healthy */
  probe(): Promise<TargetStatus>

  /** Capabilities this target supports */
  capabilities: TargetCapabilities
}

interface SpawnOptions {
  cwd: string // In target-native path format (always Linux paths for WSL)
  cols: number
  rows: number
  shell?: string // Override default shell
}

interface TargetCapabilities {
  hasGit: boolean
  defaultShell: string
  pathSeparator: '/' | '\\'
  supportsSignals: boolean
}
```

### Available Targets

| Target ID      | Description                                    | Status      |
| -------------- | ---------------------------------------------- | ----------- |
| `local`        | System's native shell (`$SHELL` or `cmd.exe`)  | Implemented |
| `wsl:auto`     | Auto-detect default WSL distribution           | Implemented |
| `wsl:<distro>` | Specific WSL distribution (e.g., `wsl:Ubuntu`) | Implemented |
| `ssh:<host>`   | Remote shell over SSH                          | Future      |

### Target Resolution

On startup, the `TargetResolver` determines which target to use:

```
1. Read user config for preferred target
2. If "wsl:auto" → detect default WSL distro → resolve to "wsl:Ubuntu" (or whatever is default)
3. If specific target → probe it (is it available? healthy?)
4. If probe fails → fall back to "local" with a warning
5. Publish resolved target + capabilities to renderer
```

The resolved target is stored per-pane in the persistence layer, so different panes can use different targets.

## WSL Target Implementation

The primary target. App runs on Windows, shells run in WSL.

### How It Works

```
Windows (Electron App)
    │
    │  WslTarget.spawn() → node-pty spawns: wsl.exe -d <distro> -- bash -l
    │
    ▼
WSL (Linux)
    │
    └── bash/zsh/fish (user's default shell)
```

### Shell Spawning

```typescript
class WslTarget implements BackendTarget {
  constructor(private distro: string) {}

  spawn(options: SpawnOptions): PtyHandle {
    return pty.spawn('wsl.exe', ['-d', this.distro, '--', 'bash', '-l'], {
      name: 'xterm-256color',
      cols: options.cols,
      rows: options.rows,
      cwd: options.cwd,
      env: process.env
    })
  }

  resolvePath(path: string): string {
    // All paths stored and used as Linux paths — no translation needed
    // Only translate at Windows↔WSL boundary when absolutely necessary
    return path
  }

  defaultCwd(): string {
    return `/home/${this.getWslUser()}`
  }
}
```

### WSL Detection

```typescript
class TargetResolver {
  async detectWslDistros(): Promise<string[]> {
    // Run: wsl.exe -l -q
    // Parse output for available distribution names
    // Return sorted list, default distro first
  }

  async resolveWslTarget(distro?: string): Promise<WslTarget> {
    const distros = await this.detectWslDistros()
    if (distros.length === 0) throw new TargetUnavailableError('No WSL distributions found')
    const selected = distro ?? distros[0] // Use specified or default
    const target = new WslTarget(selected)
    await target.probe() // Verify it's healthy
    return target
  }
}
```

### Path Handling — Linux Paths Only

A key design decision: **all paths in the app are Linux paths**. No translation layer, no Windows↔Linux conversion scattered through the codebase.

| Where                    | Path Format | Example                  |
| ------------------------ | ----------- | ------------------------ |
| Persistence (state.json) | Linux       | `/home/stepanek/project` |
| PTY spawn cwd            | Linux       | `/home/stepanek/project` |
| UI display               | Linux       | `/home/stepanek/project` |
| BackendTarget interface  | Linux       | Always target-native     |

Path translation only happens at the **boundary** — if the app ever needs to open a Windows file picker or interact with the Windows filesystem directly. This is handled inside the target implementation, never by the caller.

Why: The t3code project (issue #44) found that naive path conversion (`C:\` → `/mnt/c/`) consistently fails in real-world scenarios. By keeping everything in Linux paths and only translating at boundaries, we avoid an entire class of bugs.

## Local Target Implementation

Fallback for running on Linux/macOS natively (no WSL).

```typescript
class LocalTarget implements BackendTarget {
  spawn(options: SpawnOptions): PtyHandle {
    const shell = process.env.SHELL || '/bin/bash'
    return pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: options.cols,
      rows: options.rows,
      cwd: options.cwd,
      env: process.env
    })
  }

  defaultCwd(): string {
    return process.env.HOME || '/'
  }
}
```

## WSL-Specific Considerations

- **Environment variables** — The WSL shell inherits its own environment, not Windows env. The target's `getEnv()` returns WSL-side env.
- **Shell configuration** — `.bashrc`, `.zshrc` etc. in the WSL filesystem are used
- **Process lifecycle** — When a WSL shell exits, the pane shows "[Process exited]" and can be closed or restarted
- **Performance** — WSL2 has near-native Linux performance; terminal I/O goes through the Windows/WSL bridge but is fast for interactive use
- **Signal handling** — `Ctrl+C`, `Ctrl+Z`, `Ctrl+D` are passed through to the WSL shell correctly via the PTY
- **Reconnection** — If WSL restarts (e.g., `wsl --shutdown`), the target's `probe()` detects this and affected panes show a reconnect option

## Why BackendTarget Instead of If/Else

Without the abstraction, WSL support becomes scattered conditionals:

```typescript
// BAD: WSL as a special case
if (isWsl) {
  shell = 'wsl.exe'
  args = ['-d', distro, '--', 'bash']
  cwd = translatePath(cwd) // fragile
} else {
  shell = process.env.SHELL
  args = []
}
```

With the abstraction, the PTY manager is clean:

```typescript
// GOOD: Target handles the details
const pty = target.spawn({ cwd, cols, rows })
```

This scales to SSH, containers, or any future target without touching the PTY manager or renderer.
