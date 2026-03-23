import { homedir } from 'os'
import { readdir } from 'fs/promises'
import type { BackendTarget, SpawnConfig } from './backend-target'

export class PowershellTarget implements BackendTarget {
  id = 'powershell'
  label = 'PowerShell'

  spawn(command: string, args: string[], cwd: string): SpawnConfig {
    if (command === 'powershell.exe' || command === 'pwsh.exe') {
      return { command, args, cwd, env: process.env as Record<string, string> }
    }
    // For other commands, run them via PowerShell
    const fullCmd = [command, ...args].join(' ')
    return {
      command: 'powershell.exe',
      args: ['-NoLogo', '-Command', fullCmd],
      cwd,
      env: process.env as Record<string, string>
    }
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
}
