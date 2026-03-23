import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeElectronTRPC } from 'electron-trpc/main'

// Expose electron-trpc IPC bridge
process.once('loaded', () => {
  exposeElectronTRPC()
})

const ptyAPI = {
  create: (paneId: string, cwd?: string): Promise<void> =>
    ipcRenderer.invoke('pty:create', paneId, cwd),
  write: (paneId: string, data: string): void => {
    ipcRenderer.send('pty:write', paneId, data)
  },
  resize: (paneId: string, cols: number, rows: number): void => {
    ipcRenderer.send('pty:resize', paneId, cols, rows)
  },
  close: (paneId: string): Promise<void> => ipcRenderer.invoke('pty:close', paneId),
  onData: (callback: (paneId: string, data: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, paneId: string, data: string): void => {
      callback(paneId, data)
    }
    ipcRenderer.on('pty:data', handler)
    return () => ipcRenderer.removeListener('pty:data', handler)
  },
  onExit: (callback: (paneId: string, exitCode: number) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, paneId: string, exitCode: number): void => {
      callback(paneId, exitCode)
    }
    ipcRenderer.on('pty:exit', handler)
    return () => ipcRenderer.removeListener('pty:exit', handler)
  }
}

const dialogAPI = {
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),
  getHomedir: (): Promise<string> => ipcRenderer.invoke('dialog:getHomedir')
}

// Expose standard Electron APIs
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('pty', ptyAPI)
    contextBridge.exposeInMainWorld('dialog', dialogAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.pty = ptyAPI
  // @ts-ignore (define in dts)
  window.dialog = dialogAPI
}
