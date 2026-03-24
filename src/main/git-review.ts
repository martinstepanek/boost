import { readFile } from 'fs/promises'
import { join } from 'path'
import type { BackendTarget } from './targets/backend-target'

export interface FileStatus {
  path: string
  status: string
  staged: boolean
}

export async function getStatus(cwd: string, target: BackendTarget): Promise<FileStatus[]> {
  let output: string
  try {
    output = await target.execCommand('git', ['-C', cwd, 'status', '--porcelain=v1'])
  } catch {
    return []
  }
  if (!output.trim()) return []

  const files: FileStatus[] = []
  const lines = output.split('\n')
  for (let line of lines) {
    if (!line.trim()) continue

    // Porcelain v1 format: "XY path" — exactly 2 status chars + space + path.
    // execCommand().trim() strips leading whitespace, so the first line loses its
    // leading space when the index status is blank (e.g. " M foo" → "M foo").
    // Detect this: a proper line always has line[2] === ' '. If not, re-pad.
    if (line.length >= 2 && line[2] !== ' ') {
      line = ' ' + line
    }

    const indexStatus = line[0]
    const workTreeStatus = line[1]
    const filePath = line.slice(3)

    // Staged change (index has a status, not '?' or '!')
    if (indexStatus !== ' ' && indexStatus !== '?' && indexStatus !== '!') {
      files.push({ path: filePath, status: indexStatus, staged: true })
    }

    // Unstaged change (worktree has a status)
    if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
      files.push({ path: filePath, status: workTreeStatus, staged: false })
    }

    // Untracked files
    if (indexStatus === '?' && workTreeStatus === '?') {
      files.push({ path: filePath, status: '?', staged: false })
    }
  }

  return files
}

export async function getDiff(
  cwd: string,
  filePath: string | null,
  target: BackendTarget,
  staged: boolean = false
): Promise<string> {
  const args = ['-C', cwd, 'diff']
  if (staged) args.push('--cached')
  if (filePath) {
    args.push('--')
    args.push(filePath)
  }
  try {
    return await target.execCommand('git', args)
  } catch {
    return ''
  }
}

export async function getFileContent(
  cwd: string,
  filePath: string,
  target: BackendTarget
): Promise<string> {
  try {
    return await target.execCommand('git', ['-C', cwd, 'show', `HEAD:${filePath}`])
  } catch {
    return ''
  }
}

export async function readWorkingFile(cwd: string, filePath: string): Promise<string> {
  try {
    return await readFile(join(cwd, filePath), 'utf-8')
  } catch {
    return ''
  }
}
