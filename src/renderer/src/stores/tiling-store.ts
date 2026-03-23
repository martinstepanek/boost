import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Direction,
  PaneCommand,
  PersistedState,
  TilingNode,
  WorkspaceState
} from '../../../shared/types'
import {
  createPane,
  extractPane,
  findPaneInDirection,
  getAllPaneIds,
  movePaneInDirection,
  removePane,
  splitPane,
  updatePaneInTree,
  updateSplitRatio
} from '../lib/tiling-tree'
import { destroyTerminal } from '../lib/pty-registry'

interface TilingStore {
  activeWorkspace: number
  workspaces: Record<number, WorkspaceState>
  initialized: boolean
  splitDirection: 'horizontal' | 'vertical'
  commandPaletteOpen: boolean

  initialize(persisted: PersistedState | null): void
  setSplitDirection(direction: 'horizontal' | 'vertical'): void
  toggleCommandPalette(): void
  closeCommandPalette(): void
  splitFocusedPane(): void
  createPaneWithCommand(command: PaneCommand): void
  closeFocusedPane(): void
  moveFocus(direction: Direction): void
  setFocusedPane(paneId: string): void
  switchWorkspace(n: number): void
  setWorkspaceCwd(cwd: string): void
  swapFocusedPane(direction: Direction): void
  moveFocusedPaneToWorkspace(n: number): void
  resizeSplit(splitId: string, newRatio: number): void
  setPaneClaudeSession(paneId: string, sessionId: string): void
  getPersistedState(): PersistedState
}

function createEmptyWorkspace(cwd: string): WorkspaceState {
  return { layout: null, focusedPaneId: '', cwd }
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

export const useTilingStore = create<TilingStore>()(
  subscribeWithSelector((set, get) => ({
    activeWorkspace: 1,
    workspaces: {},
    initialized: false,
    splitDirection: 'horizontal',
    commandPaletteOpen: false,

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
          workspaces: { 1: createEmptyWorkspace('') },
          initialized: true
        })
      }
    },

    setSplitDirection(direction): void {
      set({ splitDirection: direction })
    },

    toggleCommandPalette(): void {
      set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }))
    },

    closeCommandPalette(): void {
      set({ commandPaletteOpen: false })
    },

    createPaneWithCommand(command): void {
      const { activeWorkspace, workspaces, splitDirection } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const pane = createPane()
      pane.command = command

      if (ws.layout === null) {
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, {
            ...ws,
            layout: pane,
            focusedPaneId: pane.id
          })
        })
        return
      }

      const result = splitPane(ws.layout, ws.focusedPaneId, splitDirection)
      if (!result) return

      // Replace the auto-created pane with our command pane
      const newLayout = replacePaneInTree(result.newRoot, result.newPaneId, pane)
      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: newLayout,
          focusedPaneId: pane.id
        })
      })
    },

    splitFocusedPane(): void {
      const { activeWorkspace, workspaces, splitDirection } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      // If no layout yet, create the first pane
      if (ws.layout === null) {
        const pane = createPane()
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, {
            ...ws,
            layout: pane,
            focusedPaneId: pane.id
          })
        })
        return
      }

      const result = splitPane(ws.layout, ws.focusedPaneId, splitDirection)
      if (!result) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: result.newRoot,
          focusedPaneId: result.newPaneId
        })
      })
    },

    closeFocusedPane(): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const closedPaneId = ws.focusedPaneId
      const newRoot = removePane(ws.layout, closedPaneId)

      destroyTerminal(closedPaneId)

      if (newRoot === null) {
        // Last pane closed — keep workspace but clear layout
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, {
            ...ws,
            layout: null,
            focusedPaneId: ''
          })
        })
        return
      }

      const paneIds = getAllPaneIds(newRoot)
      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: newRoot,
          focusedPaneId: paneIds[0]
        })
      })
    },

    setWorkspaceCwd(cwd): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, cwd })
      })
    },

    swapFocusedPane(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const newLayout = movePaneInDirection(ws.layout, ws.focusedPaneId, direction)
      if (newLayout === ws.layout) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: newLayout })
      })
    },

    moveFocus(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

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
          workspaces: { ...workspaces, [n]: createEmptyWorkspace('') }
        })
      } else {
        set({ activeWorkspace: n })
      }
    },

    moveFocusedPaneToWorkspace(n): void {
      const { activeWorkspace, workspaces } = get()
      if (n === activeWorkspace) return
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const extracted = extractPane(ws.layout, ws.focusedPaneId)
      if (!extracted) return

      const { pane, newRoot } = extracted

      const targetWs = workspaces[n]
      let newTargetLayout: TilingNode
      if (targetWs && targetWs.layout !== null) {
        const result = splitPane(targetWs.layout, targetWs.focusedPaneId, 'horizontal')
        newTargetLayout = result
          ? replacePaneInTree(result.newRoot, result.newPaneId, pane)
          : targetWs.layout
      } else {
        newTargetLayout = pane
      }

      const newWorkspaces = { ...workspaces }
      const targetCwd = targetWs?.cwd ?? ws.cwd
      newWorkspaces[n] = { layout: newTargetLayout, focusedPaneId: pane.id, cwd: targetCwd }

      if (newRoot === null) {
        // Last pane moved — keep workspace with empty layout
        newWorkspaces[activeWorkspace] = { ...ws, layout: null, focusedPaneId: '' }
        set({ workspaces: newWorkspaces })
      } else {
        const paneIds = getAllPaneIds(newRoot)
        newWorkspaces[activeWorkspace] = { ...ws, layout: newRoot, focusedPaneId: paneIds[0] }
        set({ workspaces: newWorkspaces })
      }
    },

    resizeSplit(splitId, newRatio): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: updateSplitRatio(ws.layout, splitId, newRatio)
        })
      })
    },

    setPaneClaudeSession(paneId, sessionId): void {
      const { workspaces } = get()
      const newWorkspaces = { ...workspaces }
      for (const [key, ws] of Object.entries(newWorkspaces)) {
        if (ws.layout === null) continue
        const updated = updatePaneInTree(ws.layout, paneId, (pane) => ({
          ...pane,
          claudeSessionId: sessionId
        }))
        if (updated !== ws.layout) {
          newWorkspaces[Number(key)] = { ...ws, layout: updated }
        }
      }
      set({ workspaces: newWorkspaces })
    },

    getPersistedState(): PersistedState {
      const { activeWorkspace, workspaces } = get()
      return { version: 1, activeWorkspace, workspaces }
    }
  }))
)
