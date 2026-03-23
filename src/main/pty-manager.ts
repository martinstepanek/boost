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

function killExisting(paneId: string): void {
  const existing = ptys.get(paneId)
  if (existing) {
    existing.kill()
    ptys.delete(paneId)
  }
}

function spawnAndRegister(paneId: string, command: string, args: string[], cwd: string): void {
  const pty = spawn(command, args, {
    name: PTY_TERM_NAME,
    cols: PTY_INITIAL_COLS,
    rows: PTY_INITIAL_ROWS,
    cwd,
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
}

export function setupPtyManager(): void {
  ipcMain.handle('pty:create', (_event, paneId: string, cwd?: string) => {
    killExisting(paneId)
    spawnAndRegister(paneId, getDefaultShell(), ['--login'], cwd || homedir())
  })

  ipcMain.handle(
    'pty:createWithCommand',
    (_event, paneId: string, command: string, args: string[], cwd?: string) => {
      killExisting(paneId)
      spawnAndRegister(paneId, command, args, cwd || homedir())
    }
  )

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
