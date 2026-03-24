import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createIPCHandler } from 'electron-trpc/main'
import { appRouter } from '../shared/router'
import { setupPtyManager, killAllPtys } from './pty-manager'
import {
  isGitInstalled,
  isGitRepo,
  listWorktrees,
  addWorktree,
  removeWorktree
} from './git-worktree'
import { WINDOW_WIDTH, WINDOW_HEIGHT } from '../shared/constants'
import {
  initTargets,
  getTarget,
  getDefaultTargetId,
  getAvailableTargets
} from './targets/target-resolver'

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('no-sandbox')
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev) {
    mainWindow.webContents.on('console-message', (_e, _level, message) => {
      console.log('[renderer]', message)
    })
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  createIPCHandler({
    router: appRouter,
    windows: [mainWindow]
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.boost')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initTargets()
  setupPtyManager()

  ipcMain.handle('targets:getAvailable', () => {
    return getAvailableTargets()
  })

  ipcMain.handle('targets:getDefaultId', () => {
    return getDefaultTargetId()
  })

  ipcMain.handle('dialog:getHomedir', async (_event, targetId?: string) => {
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return '/home'
    return await target.getHomedir()
  })

  ipcMain.handle('dialog:listDir', async (_event, dirPath: string, targetId?: string) => {
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return []
    return await target.listDir(dirPath)
  })

  ipcMain.handle('git:isInstalled', async (_event, targetId?: string) => {
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return false
    return await isGitInstalled(target)
  })

  ipcMain.handle('git:isRepo', async (_event, path: string, targetId?: string) => {
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return false
    return await isGitRepo(path, target)
  })

  ipcMain.handle('git:listWorktrees', async (_event, repoPath: string, targetId?: string) => {
    const target = getTarget(targetId || getDefaultTargetId())
    if (!target) return []
    return await listWorktrees(repoPath, target)
  })

  ipcMain.handle(
    'git:addWorktree',
    async (_event, repoPath: string, branchName: string, targetId?: string) => {
      const target = getTarget(targetId || getDefaultTargetId())
      if (!target) throw new Error('Target not found')
      return await addWorktree(repoPath, branchName, target)
    }
  )

  ipcMain.handle(
    'git:removeWorktree',
    async (_event, repoPath: string, worktreePath: string, targetId?: string, force?: boolean) => {
      const target = getTarget(targetId || getDefaultTargetId())
      if (!target) throw new Error('Target not found')
      return await removeWorktree(repoPath, worktreePath, target, force)
    }
  )

  ipcMain.handle('dialog:openFolder', async () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  killAllPtys()
})
