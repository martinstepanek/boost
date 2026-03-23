import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { PersistedState } from '../shared/types'

function getStatePath(): string {
  return join(app.getPath('userData'), 'tiling-state.json')
}

function isValidPersistedState(data: unknown): data is PersistedState {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    obj.version === 1 &&
    typeof obj.activeWorkspace === 'number' &&
    typeof obj.workspaces === 'object' &&
    obj.workspaces !== null
  )
}

export async function loadState(): Promise<PersistedState | null> {
  try {
    const data = await readFile(getStatePath(), 'utf-8')
    const parsed = JSON.parse(data)
    if (!isValidPersistedState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  const filePath = getStatePath()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}
