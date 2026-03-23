import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Direction, PersistedState, TilingNode, WorkspaceState } from '../../../shared/types'
import {
  createDefaultWorkspace,
  extractPane,
  findPaneInDirection,
  getAllPaneIds,
  removePane,
  splitPane,
  updateSplitRatio
} from '../lib/tiling-tree'

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
  moveFocusedPaneToWorkspace(n: number): void
  resizeSplit(splitId: string, newRatio: number): void
  getPersistedState(): PersistedState
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
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      const result = splitPane(ws.layout, ws.focusedPaneId, direction)
      if (!result) return

      set({
        workspaces: {
          ...workspaces,
          [activeWorkspace]: {
            layout: result.newRoot,
            focusedPaneId: result.newPaneId
          }
        }
      })
    },

    closeFocusedPane(): void {
      const { activeWorkspace, workspaces } = get()
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      const newRoot = removePane(ws.layout, ws.focusedPaneId)

      if (newRoot === null) {
        // Last pane in workspace — delete it
        const remaining = { ...workspaces }
        delete remaining[activeWorkspace]

        const keys = Object.keys(remaining)
          .map(Number)
          .sort((a, b) => a - b)
        if (keys.length === 0) {
          // No workspaces left — create workspace 1
          set({
            activeWorkspace: 1,
            workspaces: { 1: createDefaultWorkspace() }
          })
        } else {
          set({
            activeWorkspace: keys[0],
            workspaces: remaining
          })
        }
        return
      }

      // Find a new pane to focus
      const paneIds = getAllPaneIds(newRoot)
      const newFocused = paneIds[0] || ws.focusedPaneId

      set({
        workspaces: {
          ...workspaces,
          [activeWorkspace]: {
            layout: newRoot,
            focusedPaneId: newFocused
          }
        }
      })
    },

    moveFocus(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      const targetId = findPaneInDirection(ws.layout, ws.focusedPaneId, direction)
      if (!targetId) return

      set({
        workspaces: {
          ...workspaces,
          [activeWorkspace]: { ...ws, focusedPaneId: targetId }
        }
      })
    },

    setFocusedPane(paneId): void {
      const { activeWorkspace, workspaces } = get()
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      set({
        workspaces: {
          ...workspaces,
          [activeWorkspace]: { ...ws, focusedPaneId: paneId }
        }
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
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      const extracted = extractPane(ws.layout, ws.focusedPaneId)
      if (!extracted) return

      const { pane, newRoot } = extracted

      // Update target workspace
      const targetWs = workspaces[n]
      let newTargetLayout: TilingNode
      if (targetWs) {
        // Add pane to existing workspace by splitting the focused pane there
        const result = splitPane(targetWs.layout, targetWs.focusedPaneId, 'horizontal')
        if (result) {
          // Replace the new auto-created pane with our moved pane
          newTargetLayout = replacePaneInTree(result.newRoot, result.newPaneId, pane)
        } else {
          newTargetLayout = targetWs.layout
        }
      } else {
        newTargetLayout = pane
      }

      const newWorkspaces = { ...workspaces }

      // Update target
      newWorkspaces[n] = {
        layout: newTargetLayout,
        focusedPaneId: pane.id
      }

      // Update source
      if (newRoot === null) {
        delete newWorkspaces[activeWorkspace]
        const keys = Object.keys(newWorkspaces)
          .map(Number)
          .sort((a, b) => a - b)
        set({
          activeWorkspace: keys[0] || 1,
          workspaces: newWorkspaces
        })
      } else {
        const paneIds = getAllPaneIds(newRoot)
        newWorkspaces[activeWorkspace] = {
          layout: newRoot,
          focusedPaneId: paneIds[0] || ''
        }
        set({ workspaces: newWorkspaces })
      }
    },

    resizeSplit(splitId, newRatio): void {
      const { activeWorkspace, workspaces } = get()
      const ws = workspaces[activeWorkspace]
      if (!ws) return

      set({
        workspaces: {
          ...workspaces,
          [activeWorkspace]: {
            ...ws,
            layout: updateSplitRatio(ws.layout, splitId, newRatio)
          }
        }
      })
    },

    getPersistedState(): PersistedState {
      const { activeWorkspace, workspaces } = get()
      return { version: 1, activeWorkspace, workspaces }
    }
  }))
)

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
