export interface PaneNode {
  type: 'pane'
  id: string
  color: string
  app: string
  params: Record<string, unknown>
}

export interface SplitNode {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  ratio: number
  children: [TilingNode, TilingNode]
}

export type TilingNode = PaneNode | SplitNode

export interface WorkspaceState {
  layout: TilingNode | null
  focusedPaneId: string
  cwd: string
  targetId: string
}

export interface PersistedState {
  version: 1
  activeWorkspace: number
  workspaces: Record<number, WorkspaceState>
}

export type Direction = 'left' | 'down' | 'up' | 'right'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
