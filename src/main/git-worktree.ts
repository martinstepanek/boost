import type { BackendTarget } from './targets/backend-target'
import type { Worktree } from '../shared/types'

export type { Worktree }

export async function isGitInstalled(target: BackendTarget): Promise<boolean> {
  try {
    await target.execCommand('git', ['--version'])
    return true
  } catch {
    return false
  }
}

export async function isGitRepo(repoPath: string, target: BackendTarget): Promise<boolean> {
  try {
    const result = await target.execCommand('git', [
      '-C',
      repoPath,
      'rev-parse',
      '--is-inside-work-tree'
    ])
    return result === 'true'
  } catch {
    return false
  }
}

export async function listWorktrees(repoPath: string, target: BackendTarget): Promise<Worktree[]> {
  try {
    const output = await target.execCommand('git', [
      '-C',
      repoPath,
      'worktree',
      'list',
      '--porcelain'
    ])
    return parsePorcelainOutput(output)
  } catch {
    return []
  }
}

export async function addWorktree(
  repoPath: string,
  branchName: string,
  target: BackendTarget
): Promise<{ path: string }> {
  // Use the separator from the actual path to handle both Windows and Linux paths
  const sep = repoPath.includes('/') ? '/' : '\\'
  const lastSep = repoPath.lastIndexOf(sep)
  const parentDir = lastSep > 0 ? repoPath.slice(0, lastSep) : repoPath
  const repoName = lastSep > 0 ? repoPath.slice(lastSep + 1) : repoPath
  const worktreePath = `${parentDir}${sep}${repoName}-${branchName}`

  try {
    // Try creating with new branch
    await target.execCommand('git', [
      '-C',
      repoPath,
      'worktree',
      'add',
      worktreePath,
      '-b',
      branchName
    ])
  } catch {
    // Branch may already exist, try without -b
    await target.execCommand('git', ['-C', repoPath, 'worktree', 'add', worktreePath, branchName])
  }

  return { path: worktreePath }
}

export async function removeWorktree(
  repoPath: string,
  worktreePath: string,
  target: BackendTarget,
  force = false
): Promise<void> {
  const args = ['-C', repoPath, 'worktree', 'remove']
  if (force) args.push('--force')
  args.push(worktreePath)
  await target.execCommand('git', args)
}

function parsePorcelainOutput(output: string): Worktree[] {
  const worktrees: Worktree[] = []
  const blocks = output.split('\n\n').filter((b) => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n')
    let wtPath = ''
    let branch = ''
    let isMain = false

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        wtPath = line.slice('worktree '.length)
      } else if (line.startsWith('branch ')) {
        // branch refs/heads/main → main
        branch = line.slice('branch '.length).replace(/^refs\/heads\//, '')
      } else if (line === 'bare') {
        // Skip bare worktrees
        wtPath = ''
        break
      }
    }

    if (wtPath) {
      // First worktree in the list is the main one
      isMain = worktrees.length === 0
      worktrees.push({ path: wtPath, branch: branch || '(detached)', isMain })
    }
  }

  return worktrees
}
