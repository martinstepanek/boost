import { execSync } from 'child_process'
import { readdir } from 'fs/promises'
import { join } from 'path'
import type { BackendTarget, SpawnConfig } from './backend-target'

export class WslTarget implements BackendTarget {
  id: string
  label: string
  private distro: string
  private cachedHomedir: string | null = null

  constructor(distro: string) {
    this.distro = distro
    this.id = `wsl:${distro}`
    this.label = `WSL (${distro})`
  }

  getDefaultShell(): string {
    return 'bash'
  }

  getDefaultShellArgs(): string[] {
    return ['-l']
  }

  spawn(command: string, args: string[], cwd: string): SpawnConfig {
    const isDefaultShell = command === 'bash' && args.includes('-l')
    if (isDefaultShell) {
      return {
        command: 'wsl.exe',
        args: ['-d', this.distro, '--cd', cwd, '--', command, ...args],
        env: process.env as Record<string, string>
      }
    }
    // Wrap other commands in login bash so PATH includes ~/.local/bin etc.
    const fullCmd = [command, ...args].map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')
    return {
      command: 'wsl.exe',
      args: ['-d', this.distro, '--cd', cwd, '--', 'bash', '-lic', fullCmd],
      env: process.env as Record<string, string>
    }
  }

  async getHomedir(): Promise<string> {
    if (this.cachedHomedir) return this.cachedHomedir
    try {
      const result = execSync(`wsl.exe -d ${this.distro} -e bash -c "echo $HOME"`, {
        encoding: 'utf-8',
        timeout: 5000
      }).trim()
      this.cachedHomedir = result
      return result
    } catch {
      this.cachedHomedir = '/home'
      return '/home'
    }
  }

  async listDir(path: string): Promise<string[]> {
    // Access WSL filesystem via UNC path
    const uncPath = join(`\\\\wsl.localhost\\${this.distro}`, path)
    try {
      const entries = await readdir(uncPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      return []
    }
  }

  async execCommand(command: string, args: string[], cwd?: string): Promise<string> {
    // Use single quotes for shell-safe escaping (escape any existing single quotes)
    const shellEscape = (s: string): string => `'${s.replace(/'/g, "'\\''")}'`
    const fullCmd = [command, ...args].map(shellEscape).join(' ')
    const wslArgs = ['-d', this.distro]
    if (cwd) wslArgs.push('--cd', cwd)
    wslArgs.push('--', 'bash', '-lic', fullCmd)
    return execSync(['wsl.exe', ...wslArgs].join(' '), {
      encoding: 'utf-8',
      timeout: 10000
    }).trim()
  }

  static detectDistros(): string[] {
    try {
      const output = execSync('wsl.exe -l -q', {
        encoding: 'utf-8',
        timeout: 5000
      })
      return output
        .split('\n')
        .map((line) => line.replace(/\0/g, '').trim())
        .filter((line) => line.length > 0)
    } catch {
      return []
    }
  }
}
