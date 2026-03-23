import { spawn, IPty } from 'node-pty'
import { ipcMain, BrowserWindow } from 'electron'
import { homedir } from 'os'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { PTY_INITIAL_COLS, PTY_INITIAL_ROWS, PTY_TERM_NAME } from '../shared/constants'
import { getTarget, getDefaultTargetId } from './targets/target-resolver'

const ptys = new Map<string, IPty>()

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

function spawnPty(
  paneId: string,
  command: string,
  args: string[],
  cwd: string,
  env?: Record<string, string>
): number {
  const pty = spawn(command, args, {
    name: PTY_TERM_NAME,
    cols: PTY_INITIAL_COLS,
    rows: PTY_INITIAL_ROWS,
    cwd: cwd || homedir(),
    env: env || (process.env as Record<string, string>)
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

  return pty.pid
}

export function setupPtyManager(): void {
  // Create shell via target
  ipcMain.handle('pty:create', (_event, paneId: string, targetId?: string, cwd?: string) => {
    killExisting(paneId)
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return -1

    const config = target.spawn(target.getDefaultShell(), target.getDefaultShellArgs(), cwd || homedir())
    return spawnPty(paneId, config.command, config.args, config.cwd || '', config.env)
  })

  // Create with specific command via target
  ipcMain.handle(
    'pty:createWithCommand',
    (_event, paneId: string, command: string, args: string[], targetId?: string, cwd?: string) => {
      killExisting(paneId)
      const target = getTarget(targetId || getDefaultTargetId())
      if (!target) return -1

      const config = target.spawn(command, args, cwd || homedir())
      return spawnPty(paneId, config.command, config.args, config.cwd || '', config.env)
    }
  )

  ipcMain.handle('pty:getClaudeSession', async (_event, pid: number) => {
    const sessionFile = join(homedir(), '.claude', 'sessions', `${pid}.json`)
    try {
      const data = await readFile(sessionFile, 'utf-8')
      const parsed = JSON.parse(data)
      return typeof parsed.sessionId === 'string' ? parsed.sessionId : null
    } catch {
      return null
    }
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
