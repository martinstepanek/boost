import { ElectronAPI } from '@electron-toolkit/preload'

interface PtyAPI {
  create: (paneId: string, cwd?: string) => Promise<void>
  write: (paneId: string, data: string) => void
  resize: (paneId: string, cols: number, rows: number) => void
  close: (paneId: string) => Promise<void>
  onData: (callback: (paneId: string, data: string) => void) => () => void
  onExit: (callback: (paneId: string, exitCode: number) => void) => () => void
}

interface DialogAPI {
  openFolder: () => Promise<string | null>
  getHomedir: () => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    pty: PtyAPI
    dialog: DialogAPI
  }
}
