import { spawn, IPty } from 'node-pty'
import { ipcMain, BrowserWindow } from 'electron'
import { homedir } from 'os'
import { join } from 'path'
import { readFile, readdir, stat } from 'fs/promises'
import { PTY_INITIAL_COLS, PTY_INITIAL_ROWS, PTY_TERM_NAME } from '../shared/constants'
import { getTarget, getDefaultTargetId } from './targets/target-resolver'

const ptys = new Map<string, IPty>()
const paneTargets = new Map<string, { targetId: string; spawnTime: number }>()

function getMainWindow(): BrowserWindow | null {
  const win = BrowserWindow.getAllWindows()[0]
  return win && !win.isDestroyed() ? win : null
}

function killExisting(paneId: string): void {
  const existing = ptys.get(paneId)
  if (existing) {
    existing.kill()
    ptys.delete(paneId)
    paneTargets.delete(paneId)
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

async function getWslClaudeSession(
  targetId: string,
  spawnTime: number
): Promise<string | null> {
  const distro = targetId.replace('wsl:', '')
  const target = getTarget(targetId)
  if (!target) return null

  try {
    const wslHome = await target.getHomedir()
    const sessionsUncPath = join(
      `\\\\wsl.localhost\\${distro}`,
      wslHome,
      '.claude',
      'sessions'
    )

    const entries = await readdir(sessionsUncPath)
    const jsonFiles = entries.filter((f) => f.endsWith('.json'))
    if (jsonFiles.length === 0) return null

    // Find the newest session file created after our spawn time
    let newest: { file: string; mtime: number } | null = null
    for (const file of jsonFiles) {
      const filePath = join(sessionsUncPath, file)
      const fileStat = await stat(filePath)
      const mtime = fileStat.mtimeMs
      if (mtime >= spawnTime && (!newest || mtime > newest.mtime)) {
        newest = { file: filePath, mtime }
      }
    }

    if (!newest) return null

    const data = await readFile(newest.file, 'utf-8')
    const parsed = JSON.parse(data)
    return typeof parsed.sessionId === 'string' ? parsed.sessionId : null
  } catch {
    return null
  }
}

export function setupPtyManager(): void {
  // Create shell via target
  ipcMain.handle('pty:create', (_event, paneId: string, targetId?: string, cwd?: string) => {
    killExisting(paneId)
    const resolvedTargetId = targetId || getDefaultTargetId()
    const target = getTarget(resolvedTargetId)
    if (!target) return -1

    paneTargets.set(paneId, { targetId: resolvedTargetId, spawnTime: Date.now() })
    const config = target.spawn(
      target.getDefaultShell(),
      target.getDefaultShellArgs(),
      cwd || homedir()
    )
    return spawnPty(paneId, config.command, config.args, config.cwd || '', config.env)
  })

  // Create with specific command via target
  ipcMain.handle(
    'pty:createWithCommand',
    (_event, paneId: string, command: string, args: string[], targetId?: string, cwd?: string) => {
      killExisting(paneId)
      const resolvedTargetId = targetId || getDefaultTargetId()
      const target = getTarget(resolvedTargetId)
      if (!target) return -1

      paneTargets.set(paneId, { targetId: resolvedTargetId, spawnTime: Date.now() })
      const config = target.spawn(command, args, cwd || homedir())
      return spawnPty(paneId, config.command, config.args, config.cwd || '', config.env)
    }
  )

  ipcMain.handle('pty:getClaudeSession', async (_event, paneId: string) => {
    const pty = ptys.get(paneId)
    const paneInfo = paneTargets.get(paneId)
    if (!pty) return null

    const targetId = paneInfo?.targetId || getDefaultTargetId()
    const target = getTarget(targetId)
    if (!target) return null

    // For WSL targets, scan sessions dir via UNC path (PID doesn't match across OS boundary)
    if (targetId.startsWith('wsl:')) {
      return getWslClaudeSession(targetId, paneInfo?.spawnTime || 0)
    }

    // For local targets, use PID-based lookup
    const sessionFile = join(homedir(), '.claude', 'sessions', `${pty.pid}.json`)
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
    try {
      ptys.get(paneId)?.resize(cols, rows)
    } catch {
      // PTY may have already exited
    }
  })

  ipcMain.handle('pty:close', (_event, paneId: string) => {
    const pty = ptys.get(paneId)
    if (pty) {
      pty.kill()
      ptys.delete(paneId)
      paneTargets.delete(paneId)
    }
  })
}

export function killAllPtys(): void {
  for (const [, pty] of ptys) {
    pty.kill()
  }
  ptys.clear()
  paneTargets.clear()
}
