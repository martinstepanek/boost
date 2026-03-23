import { spawn, IPty } from 'node-pty'
import { ipcMain, BrowserWindow } from 'electron'
import { homedir } from 'os'
import { PTY_INITIAL_COLS, PTY_INITIAL_ROWS, PTY_TERM_NAME } from '../shared/constants'

const ptys = new Map<string, IPty>()

function getDefaultShell(): string {
  return process.env.SHELL || '/bin/bash'
}

function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0]
  return win && !win.isDestroyed() ? win : null
}

export function setupPtyManager(): void {
  ipcMain.handle('pty:create', (_event, paneId: string) => {
    const existing = ptys.get(paneId)
    if (existing) {
      existing.kill()
      ptys.delete(paneId)
    }

    const pty = spawn(getDefaultShell(), ['--login'], {
      name: PTY_TERM_NAME,
      cols: PTY_INITIAL_COLS,
      rows: PTY_INITIAL_ROWS,
      cwd: homedir(),
      env: process.env as Record<string, string>
    })

    ptys.set(paneId, pty)

    pty.onData((data) => {
      if (!ptys.has(paneId)) return
      const win = getMainWindow()
      if (win) win.webContents.send('pty:data', paneId, data)
    })

    pty.onExit(({ exitCode }) => {
      ptys.delete(paneId)
      const win = getMainWindow()
      if (win) win.webContents.send('pty:exit', paneId, exitCode)
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
