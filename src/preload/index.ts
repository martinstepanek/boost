import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeElectronTRPC } from 'electron-trpc/main'

// Expose electron-trpc IPC bridge
process.once('loaded', () => {
  exposeElectronTRPC()
})

const ptyAPI = {
  create: (paneId: string, targetId?: string, cwd?: string): Promise<number> =>
    ipcRenderer.invoke('pty:create', paneId, targetId, cwd),
  createWithCommand: (
    paneId: string,
    command: string,
    args: string[],
    targetId?: string,
    cwd?: string
  ): Promise<number> =>
    ipcRenderer.invoke('pty:createWithCommand', paneId, command, args, targetId, cwd),
  getClaudeSession: (pid: number): Promise<string | null> =>
    ipcRenderer.invoke('pty:getClaudeSession', pid),
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
  getHomedir: (targetId?: string): Promise<string> =>
    ipcRenderer.invoke('dialog:getHomedir', targetId),
  listDir: (dirPath: string, targetId?: string): Promise<string[]> =>
    ipcRenderer.invoke('dialog:listDir', dirPath, targetId)
}

const gitAPI = {
  isInstalled: (targetId?: string): Promise<boolean> =>
    ipcRenderer.invoke('git:isInstalled', targetId),
  isRepo: (path: string, targetId?: string): Promise<boolean> =>
    ipcRenderer.invoke('git:isRepo', path, targetId),
  listWorktrees: (
    repoPath: string,
    targetId?: string
  ): Promise<Array<{ path: string; branch: string; isMain: boolean }>> =>
    ipcRenderer.invoke('git:listWorktrees', repoPath, targetId),
  addWorktree: (
    repoPath: string,
    branchName: string,
    targetId?: string
  ): Promise<{ path: string }> =>
    ipcRenderer.invoke('git:addWorktree', repoPath, branchName, targetId),
  removeWorktree: (
    repoPath: string,
    worktreePath: string,
    targetId?: string,
    force?: boolean
  ): Promise<void> =>
    ipcRenderer.invoke('git:removeWorktree', repoPath, worktreePath, targetId, force)
}

const targetsAPI = {
  getAvailable: (): Promise<Array<{ id: string; label: string }>> =>
    ipcRenderer.invoke('targets:getAvailable'),
  getDefaultId: (): Promise<string> => ipcRenderer.invoke('targets:getDefaultId')
}

// Expose standard Electron APIs
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('pty', ptyAPI)
    contextBridge.exposeInMainWorld('dialog', dialogAPI)
    contextBridge.exposeInMainWorld('git', gitAPI)
    contextBridge.exposeInMainWorld('targets', targetsAPI)
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
  // @ts-ignore (define in dts)
  window.git = gitAPI
  // @ts-ignore (define in dts)
  window.targets = targetsAPI
}
