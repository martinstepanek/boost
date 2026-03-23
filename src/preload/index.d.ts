import { ElectronAPI } from '@electron-toolkit/preload'

interface PtyAPI {
  create: (paneId: string) => Promise<void>
  write: (paneId: string, data: string) => void
  resize: (paneId: string, cols: number, rows: number) => void
  close: (paneId: string) => Promise<void>
  onData: (callback: (paneId: string, data: string) => void) => () => void
  onExit: (callback: (paneId: string, exitCode: number) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    pty: PtyAPI
  }
}
