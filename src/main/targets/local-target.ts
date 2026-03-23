import { homedir } from 'os'
import { readdir } from 'fs/promises'
import type { BackendTarget, SpawnConfig } from './backend-target'

function getDefaultShell(): string {
  return process.env.SHELL || '/bin/bash'
}

export class LocalTarget implements BackendTarget {
  id = 'local'
  label = 'Terminal'

  spawn(command: string, args: string[], cwd: string): SpawnConfig {
    return { command, args, cwd, env: process.env as Record<string, string> }
  }

  async getHomedir(): Promise<string> {
    return homedir()
  }

  async listDir(path: string): Promise<string[]> {
    try {
      const entries = await readdir(path, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      return []
    }
  }

  getDefaultShell(): string {
    return getDefaultShell()
  }

  getDefaultShellArgs(): string[] {
    return ['--login']
  }
}
