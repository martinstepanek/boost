import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Direction, PersistedState, TilingNode, WorkspaceState } from '../../../shared/types'
import {
  createDefaultWorkspace,
  extractPane,
  findPaneInDirection,
  getAllPaneIds,
  movePaneInDirection,
  removePane,
  splitPane,
  updateSplitRatio
} from '../lib/tiling-tree'
import { destroyTerminal } from '../lib/pty-registry'

interface TilingStore {
  activeWorkspace: number
  workspaces: Record<number, WorkspaceState>
  initialized: boolean

  initialize(persisted: PersistedState | null): void
  splitFocusedPane(direction: 'horizontal' | 'vertical'): void
  closeFocusedPane(): void
  moveFocus(direction: Direction): void
  setFocusedPane(paneId: string): void
  switchWorkspace(n: number): void
  swapFocusedPane(direction: Direction): void
  moveFocusedPaneToWorkspace(n: number): void
  resizeSplit(splitId: string, newRatio: number): void
  getPersistedState(): PersistedState
}

function replacePaneInTree(
  root: TilingNode,
  targetId: string,
  replacement: TilingNode
): TilingNode {
  if (root.type === 'pane') {
    return root.id === targetId ? replacement : root
  }
  return {
    ...root,
    children: [
      replacePaneInTree(root.children[0], targetId, replacement),
      replacePaneInTree(root.children[1], targetId, replacement)
    ]
  }
}

function getWorkspace(
  workspaces: Record<number, WorkspaceState>,
  n: number
): WorkspaceState | undefined {
  return workspaces[n]
}

function updateWorkspace(
  workspaces: Record<number, WorkspaceState>,
  n: number,
  ws: WorkspaceState
): Record<number, WorkspaceState> {
  return { ...workspaces, [n]: ws }
}

function getLowestWorkspaceKey(workspaces: Record<number, WorkspaceState>): number | undefined {
  const keys = Object.keys(workspaces)
    .map(Number)
    .sort((a, b) => a - b)
  return keys[0]
}

export const useTilingStore = create<TilingStore>()(
  subscribeWithSelector((set, get) => ({
    activeWorkspace: 1,
    workspaces: {},
    initialized: false,

    initialize(persisted: PersistedState | null): void {
      if (persisted && persisted.version === 1 && Object.keys(persisted.workspaces).length > 0) {
        set({
          activeWorkspace: persisted.activeWorkspace,
          workspaces: persisted.workspaces,
          initialized: true
        })
      } else {
        set({
          activeWorkspace: 1,
          workspaces: { 1: createDefaultWorkspace() },
          initialized: true
        })
      }
    },

    splitFocusedPane(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const result = splitPane(ws.layout, ws.focusedPaneId, direction)
      if (!result) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          layout: result.newRoot,
          focusedPaneId: result.newPaneId
        })
      })
    },

    closeFocusedPane(): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const closedPaneId = ws.focusedPaneId
      const newRoot = removePane(ws.layout, closedPaneId)

      destroyTerminal(closedPaneId)

      if (newRoot === null) {
        const remaining = { ...workspaces }
        delete remaining[activeWorkspace]

        const nextKey = getLowestWorkspaceKey(remaining)
        if (nextKey === undefined) {
          set({
            activeWorkspace: 1,
            workspaces: { 1: createDefaultWorkspace() }
          })
        } else {
          set({ activeWorkspace: nextKey, workspaces: remaining })
        }
        return
      }

      const paneIds = getAllPaneIds(newRoot)
      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          layout: newRoot,
          focusedPaneId: paneIds[0]
        })
      })
    },

    swapFocusedPane(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const newLayout = movePaneInDirection(ws.layout, ws.focusedPaneId, direction)
      if (newLayout === ws.layout) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: newLayout })
      })
    },

    moveFocus(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const targetId = findPaneInDirection(ws.layout, ws.focusedPaneId, direction)
      if (!targetId) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          focusedPaneId: targetId
        })
      })
    },

    setFocusedPane(paneId): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          focusedPaneId: paneId
        })
      })
    },

    switchWorkspace(n): void {
      const { workspaces } = get()
      if (!workspaces[n]) {
        set({
          activeWorkspace: n,
          workspaces: { ...workspaces, [n]: createDefaultWorkspace() }
        })
      } else {
        set({ activeWorkspace: n })
      }
    },

    moveFocusedPaneToWorkspace(n): void {
      const { activeWorkspace, workspaces } = get()
      if (n === activeWorkspace) return
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const extracted = extractPane(ws.layout, ws.focusedPaneId)
      if (!extracted) return

      const { pane, newRoot } = extracted

      const targetWs = workspaces[n]
      let newTargetLayout: TilingNode
      if (targetWs) {
        const result = splitPane(targetWs.layout, targetWs.focusedPaneId, 'horizontal')
        newTargetLayout = result
          ? replacePaneInTree(result.newRoot, result.newPaneId, pane)
          : targetWs.layout
      } else {
        newTargetLayout = pane
      }

      const newWorkspaces = { ...workspaces }
      newWorkspaces[n] = { layout: newTargetLayout, focusedPaneId: pane.id }

      if (newRoot === null) {
        delete newWorkspaces[activeWorkspace]
        const nextKey = getLowestWorkspaceKey(newWorkspaces)
        set({ activeWorkspace: nextKey ?? 1, workspaces: newWorkspaces })
      } else {
        const paneIds = getAllPaneIds(newRoot)
        newWorkspaces[activeWorkspace] = { layout: newRoot, focusedPaneId: paneIds[0] }
        set({ workspaces: newWorkspaces })
      }
    },

    resizeSplit(splitId, newRatio): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: updateSplitRatio(ws.layout, splitId, newRatio)
        })
      })
    },

    getPersistedState(): PersistedState {
      const { activeWorkspace, workspaces } = get()
      return { version: 1, activeWorkspace, workspaces }
    }
  }))
)
