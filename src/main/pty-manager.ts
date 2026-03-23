import { spawn, IPty } from 'node-pty'
import { ipcMain, BrowserWindow } from 'electron'
import * as os from 'os'

const ptys = new Map<string, IPty>()

function getDefaultShell(): string {
  return process.env.SHELL || '/bin/bash'
}

export function setupPtyManager(): void {
  ipcMain.handle('pty:create', (_event, paneId: string) => {
    // Kill existing PTY for this pane (handles React StrictMode double-mount)
    const existing = ptys.get(paneId)
    if (existing) {
      existing.kill()
      ptys.delete(paneId)
    }

    const shell = getDefaultShell()
    const pty = spawn(shell, ['--login'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: os.homedir(),
      env: process.env as Record<string, string>
    })

    ptys.set(paneId, pty)

    // Stream data to renderer
    pty.onData((data) => {
      // Check PTY is still tracked (not killed) and window exists
      if (!ptys.has(paneId)) return
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('pty:data', paneId, data)
      }
    })

    pty.onExit(({ exitCode }) => {
      ptys.delete(paneId)
      const win = BrowserWindow.getAllWindows()[0]
      if (win && !win.isDestroyed()) {
        win.webContents.send('pty:exit', paneId, exitCode)
      }
    })
  })

  ipcMain.on('pty:write', (_event, paneId: string, data: string) => {
    ptys.get(paneId)?.write(data)
  })

  ipcMain.on('pty:resize', (_event, paneId: string, cols: number, rows: number) => {
    ptys.get(paneId)?.resize(cols, rows)
  })

  ipcMain.handle('pty:close', (_event, paneId: string) => {
    const pty = ptys.get(paneId)
    if (pty) {
      pty.kill()
      ptys.delete(paneId)
    }
  })
}

export function killAllPtys(): void {
  for (const [, pty] of ptys) {
    pty.kill()
  }
  ptys.clear()
}
