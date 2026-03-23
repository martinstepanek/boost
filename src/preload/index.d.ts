import { ElectronAPI } from '@electron-toolkit/preload'

interface PtyAPI {
  create: (paneId: string, targetId?: string, cwd?: string) => Promise<number>
  createWithCommand: (
    paneId: string,
    command: string,
    args: string[],
    targetId?: string,
    cwd?: string
  ) => Promise<number>
  getClaudeSession: (pid: number) => Promise<string | null>
  write: (paneId: string, data: string) => void
  resize: (paneId: string, cols: number, rows: number) => void
  close: (paneId: string) => Promise<void>
  onData: (callback: (paneId: string, data: string) => void) => () => void
  onExit: (callback: (paneId: string, exitCode: number) => void) => () => void
}

interface DialogAPI {
  openFolder: () => Promise<string | null>
  getHomedir: (targetId?: string) => Promise<string>
  listDir: (dirPath: string, targetId?: string) => Promise<string[]>
}

interface TargetsAPI {
  getAvailable: () => Promise<Array<{ id: string; label: string }>>
  getDefaultId: () => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    pty: PtyAPI
    dialog: DialogAPI
    targets: TargetsAPI
  }
}
