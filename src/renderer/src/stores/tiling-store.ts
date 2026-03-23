import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Direction, PersistedState, TilingNode, WorkspaceState } from '../../../shared/types'
import {
  convertFromTabs,
  convertToTabs,
  createPane,
  extractPane,
  extractPaneFromTab,
  findNode,
  findParent,
  findPaneInDirection,
  findTabContaining,
  getAllPaneIds,
  movePaneInDirection,
  removePane,
  splitPane,
  switchTab as switchTabInTree,
  updatePaneInTree,
  updateSplitRatio
} from '../lib/tiling-tree'
import { destroyTerminal } from '../lib/pty-registry'

interface TilingStore {
  activeWorkspace: number
  workspaces: Record<number, WorkspaceState>
  initialized: boolean
  commandPaletteOpen: boolean

  initialize(persisted: PersistedState | null): void
  setPaneSplitDirection(direction: 'horizontal' | 'vertical'): void
  toggleCommandPalette(): void
  closeCommandPalette(): void
  splitFocusedPane(): void
  createPaneForApp(appId: string): void
  closeFocusedPane(): void
  moveFocus(direction: Direction): void
  setFocusedPane(paneId: string): void
  switchWorkspace(n: number): void
  setWorkspaceCwd(cwd: string): void
  setWorkspaceTarget(targetId: string): void
  swapFocusedPane(direction: Direction): void
  moveFocusedPaneToWorkspace(n: number): void
  resizeSplit(splitId: string, newRatio: number): void
  setPaneParam(paneId: string, key: string, value: unknown): void
  toggleTabLayout(): void
  toggleSplitLayout(): void
  switchActiveTab(tabId: string, index: number): void
  cycleTab(delta: number): void
  getPersistedState(): PersistedState
}

function getFocusedPaneSplitDirection(ws: WorkspaceState): 'horizontal' | 'vertical' {
  if (!ws.layout) return 'horizontal'
  const node = findNode(ws.layout, ws.focusedPaneId)
  if (node?.type === 'pane') return node.splitDirection
  return 'horizontal'
}

function createEmptyWorkspace(cwd: string, targetId: string = ''): WorkspaceState {
  return { layout: null, focusedPaneId: '', cwd, targetId }
}

function replacePaneInTree(
  root: TilingNode,
  targetId: string,
  replacement: TilingNode
): TilingNode {
  if (root.type === 'pane') {
    return root.id === targetId ? replacement : root
  }
  if (root.type === 'tab') {
    // Tab children are panes — only replace if target matches a child ID
    const newChildren = root.children.map((c) =>
      c.id === targetId && replacement.type === 'pane' ? replacement : c
    )
    return { ...root, children: newChildren }
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
    commandPaletteOpen: false,

    initialize(persisted: PersistedState | null): void {
      if (persisted && persisted.version === 1 && Object.keys(persisted.workspaces).length > 0) {
        // Ensure all workspaces have required fields (handles old state format)
        const workspaces: Record<number, WorkspaceState> = {}
        for (const [key, ws] of Object.entries(persisted.workspaces)) {
          workspaces[Number(key)] = {
            layout: ws.layout ?? null,
            focusedPaneId: ws.focusedPaneId ?? '',
            cwd: ws.cwd ?? '',
            targetId: ws.targetId ?? ''
          }
        }
        set({
          activeWorkspace: persisted.activeWorkspace,
          workspaces,
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

    setPaneSplitDirection(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const updated = updatePaneInTree(ws.layout, ws.focusedPaneId, (pane) => ({
        ...pane,
        splitDirection: direction
      }))
      if (updated !== ws.layout) {
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: updated })
        })
      }
    },

    toggleCommandPalette(): void {
      set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }))
    },

    closeCommandPalette(): void {
      set({ commandPaletteOpen: false })
    },

    createPaneForApp(appId): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      const splitDirection = getFocusedPaneSplitDirection(ws)
      const pane = createPane(appId)

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
      const { activeWorkspace, workspaces } = get()
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

      const splitDirection = getFocusedPaneSplitDirection(ws)
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

    setWorkspaceTarget(targetId): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws) return

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, targetId })
      })
    },

    swapFocusedPane(direction): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      // If inside a tab, extract pane from tab into a split
      const tab = findTabContaining(ws.layout, ws.focusedPaneId)
      if (tab) {
        const newLayout = extractPaneFromTab(ws.layout, ws.focusedPaneId, direction)
        if (newLayout !== ws.layout) {
          set({
            workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: newLayout })
          })
        }
        return
      }

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

      // If inside a tab, try cycling tabs first
      const tab = findTabContaining(ws.layout, ws.focusedPaneId)
      if (tab) {
        const delta = direction === 'right' || direction === 'down' ? 1 : -1
        const atEdge =
          (delta === 1 && tab.activeIndex >= tab.children.length - 1) ||
          (delta === -1 && tab.activeIndex <= 0)

        if (!atEdge) {
          const newLayout = switchTabInTree(ws.layout, tab.id, delta)
          const newTab = findNode(newLayout, tab.id)
          if (newTab?.type === 'tab') {
            const activeChild = newTab.children[newTab.activeIndex]
            const newFocused = activeChild
              ? (getAllPaneIds(activeChild)[0] ?? ws.focusedPaneId)
              : ws.focusedPaneId
            set({
              workspaces: updateWorkspace(workspaces, activeWorkspace, {
                ...ws,
                layout: newLayout,
                focusedPaneId: newFocused
              })
            })
          }
          return
        }
        // At edge of tabs — fall through to geometric navigation
      }

      const targetId = findPaneInDirection(ws.layout, ws.focusedPaneId, direction)
      if (targetId) {
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, {
            ...ws,
            focusedPaneId: targetId
          })
        })
      }
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
      const targetTargetId = targetWs?.targetId ?? ws.targetId
      newWorkspaces[n] = {
        layout: newTargetLayout,
        focusedPaneId: pane.id,
        cwd: targetCwd,
        targetId: targetTargetId
      }

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

    setPaneParam(paneId, key, value): void {
      const { workspaces } = get()
      const newWorkspaces = { ...workspaces }
      for (const [wsKey, ws] of Object.entries(newWorkspaces)) {
        if (ws.layout === null) continue
        const updated = updatePaneInTree(ws.layout, paneId, (pane) => ({
          ...pane,
          params: { ...pane.params, [key]: value }
        }))
        if (updated !== ws.layout) {
          newWorkspaces[Number(wsKey)] = { ...ws, layout: updated }
        }
      }
      set({ workspaces: newWorkspaces })
    },

    toggleTabLayout(): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      // Find the parent split of the focused pane and convert it to tabs
      const parentInfo = findParent(ws.layout, ws.focusedPaneId)
      if (!parentInfo || parentInfo.parent.type !== 'split') return

      const newLayout = convertToTabs(ws.layout, parentInfo.parent.id)
      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: newLayout })
      })
    },

    toggleSplitLayout(): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const tab = findTabContaining(ws.layout, ws.focusedPaneId)
      if (!tab) return

      const newLayout = convertFromTabs(ws.layout, tab.id)
      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, { ...ws, layout: newLayout })
      })
    },

    switchActiveTab(tabId, index): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const tabNode = findNode(ws.layout, tabId)
      if (!tabNode || tabNode.type !== 'tab') return

      const newLayout = switchTabInTree(ws.layout, tabId, index - tabNode.activeIndex)
      const activeChild = tabNode.children[index]
      const newFocused = activeChild
        ? (getAllPaneIds(activeChild)[0] ?? ws.focusedPaneId)
        : ws.focusedPaneId

      set({
        workspaces: updateWorkspace(workspaces, activeWorkspace, {
          ...ws,
          layout: newLayout,
          focusedPaneId: newFocused
        })
      })
    },

    cycleTab(delta): void {
      const { activeWorkspace, workspaces } = get()
      const ws = getWorkspace(workspaces, activeWorkspace)
      if (!ws || ws.layout === null) return

      const tab = findTabContaining(ws.layout, ws.focusedPaneId)
      if (!tab) return

      const newLayout = switchTabInTree(ws.layout, tab.id, delta)
      // Get the new active child's first pane for focus
      const newTab = findNode(newLayout, tab.id)
      if (newTab?.type === 'tab') {
        const activeChild = newTab.children[newTab.activeIndex]
        const newFocused = activeChild
          ? (getAllPaneIds(activeChild)[0] ?? ws.focusedPaneId)
          : ws.focusedPaneId
        set({
          workspaces: updateWorkspace(workspaces, activeWorkspace, {
            ...ws,
            layout: newLayout,
            focusedPaneId: newFocused
          })
        })
      }
    },

    getPersistedState(): PersistedState {
      const { activeWorkspace, workspaces } = get()
      return { version: 1, activeWorkspace, workspaces }
    }
  }))
)

