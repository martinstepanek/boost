import { ElectronAPI } from '@electron-toolkit/preload'

interface PtyAPI {
  create: (paneId: string, targetId?: string, cwd?: string) => Promise<number>
  createWithCommand: (
    paneId: string,
    command: string,
    args: string[],
    targetId?: string,
    cwd?: string
  ) => Promise<number>
  getClaudeSession: (paneId: string) => Promise<string | null>
  write: (paneId: string, data: string) => void
  typeText: (paneId: string, text: string) => void
  resize: (paneId: string, cols: number, rows: number) => void
  close: (paneId: string) => Promise<void>
  onData: (callback: (paneId: string, data: string) => void) => () => void
  onExit: (callback: (paneId: string, exitCode: number) => void) => () => void
}

interface DialogAPI {
  openFolder: () => Promise<string | null>
  getHomedir: (targetId?: string) => Promise<string>
  listDir: (dirPath: string, targetId?: string) => Promise<string[]>
}

interface GitAPI {
  isInstalled: (targetId?: string) => Promise<boolean>
  isRepo: (path: string, targetId?: string) => Promise<boolean>
  listWorktrees: (
    repoPath: string,
    targetId?: string
  ) => Promise<Array<{ path: string; branch: string; isMain: boolean }>>
  addWorktree: (
    repoPath: string,
    branchName: string,
    targetId?: string
  ) => Promise<{ path: string }>
  removeWorktree: (
    repoPath: string,
    worktreePath: string,
    targetId?: string,
    force?: boolean
  ) => Promise<void>
  status: (
    cwd: string,
    targetId?: string
  ) => Promise<Array<{ path: string; status: string; staged: boolean }>>
  diff: (
    cwd: string,
    filePath: string | null,
    staged: boolean,
    targetId?: string
  ) => Promise<string>
  fileContent: (cwd: string, filePath: string, targetId?: string) => Promise<string>
  readWorkingFile: (cwd: string, filePath: string) => Promise<string>
}

interface TargetsAPI {
  getAvailable: () => Promise<Array<{ id: string; label: string }>>
  getDefaultId: () => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    pty: PtyAPI
    dialog: DialogAPI
    git: GitAPI
    targets: TargetsAPI
  }
}
