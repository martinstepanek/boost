import type { BackendTarget, TargetInfo } from './backend-target'
import { LocalTarget } from './local-target'
import { WslTarget } from './wsl-target'
import { PowershellTarget } from './powershell-target'

const targets = new Map<string, BackendTarget>()

export function initTargets(): void {
  targets.clear()

  if (process.platform === 'win32') {
    // Detect WSL distros
    const distros = WslTarget.detectDistros()
    for (const distro of distros) {
      const target = new WslTarget(distro)
      targets.set(target.id, target)
    }
    // Always add PowerShell
    const ps = new PowershellTarget()
    targets.set(ps.id, ps)
  } else {
    // Linux/macOS
    const local = new LocalTarget()
    targets.set(local.id, local)
  }
}

export function getTarget(targetId: string): BackendTarget | undefined {
  return targets.get(targetId)
}

export function getDefaultTargetId(): string {
  if (process.platform === 'win32') {
    // Prefer first WSL target, fallback to PowerShell
    for (const [id] of targets) {
      if (id.startsWith('wsl:')) return id
    }
    return 'powershell'
  }
  return 'local'
}

export function getAvailableTargets(): TargetInfo[] {
  return Array.from(targets.values()).map((t) => ({ id: t.id, label: t.label }))
}
