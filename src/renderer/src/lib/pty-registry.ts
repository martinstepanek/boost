import type { FitAddon } from '@xterm/addon-fit'

const activePtys = new Set<string>()
const fitAddons = new Map<string, FitAddon>()

export function registerPty(paneId: string): void {
  activePtys.add(paneId)
}

export function isPtyActive(paneId: string): boolean {
  return activePtys.has(paneId)
}

export function unregisterPty(paneId: string): void {
  activePtys.delete(paneId)
}

export function registerFitAddon(paneId: string, addon: FitAddon): void {
  fitAddons.set(paneId, addon)
}

export function unregisterFitAddon(paneId: string): void {
  fitAddons.delete(paneId)
}

export function getFitAddon(paneId: string): FitAddon | undefined {
  return fitAddons.get(paneId)
}

export function destroyTerminal(paneId: string): void {
  if (activePtys.has(paneId)) {
    window.pty.close(paneId)
    activePtys.delete(paneId)
  }
  fitAddons.delete(paneId)
}
