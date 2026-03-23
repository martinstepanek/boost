import type {
  PaneNode,
  SplitNode,
  TilingNode,
  WorkspaceState,
  Direction,
  Rect
} from '../../../shared/types'

const PANE_COLORS = [
  '#1e3a5f',
  '#3b1f2b',
  '#1f3b2b',
  '#3b2f1f',
  '#2b1f3b',
  '#1f2b3b',
  '#3b1f1f',
  '#1f3b3b',
  '#2f3b1f',
  '#1f1f3b',
  '#4a2040',
  '#204a40',
  '#40204a',
  '#4a4020',
  '#20404a'
]

let paneCounter = 0
let splitCounter = 0

export function generatePaneId(): string {
  return `pane-${++paneCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateSplitId(): string {
  return `split-${++splitCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateRandomColor(): string {
  return PANE_COLORS[Math.floor(Math.random() * PANE_COLORS.length)]
}

export function createPane(): PaneNode {
  return { type: 'pane', id: generatePaneId(), color: generateRandomColor() }
}

export function createDefaultWorkspace(): WorkspaceState {
  const pane = createPane()
  return { layout: pane, focusedPaneId: pane.id }
}

export function findNode(root: TilingNode, id: string): TilingNode | null {
  if (root.type === 'pane') {
    return root.id === id ? root : null
  }
  if (root.id === id) return root
  return findNode(root.children[0], id) || findNode(root.children[1], id)
}

export function findParent(
  root: TilingNode,
  paneId: string
): { parent: SplitNode; childIndex: 0 | 1 } | null {
  if (root.type === 'pane') return null
  for (const idx of [0, 1] as const) {
    const child = root.children[idx]
    if (
      (child.type === 'pane' && child.id === paneId) ||
      (child.type === 'split' && child.id === paneId)
    ) {
      return { parent: root, childIndex: idx }
    }
    const result = findParent(child, paneId)
    if (result) return result
  }
  return null
}

export function getAllPaneIds(root: TilingNode): string[] {
  if (root.type === 'pane') return [root.id]
  return [...getAllPaneIds(root.children[0]), ...getAllPaneIds(root.children[1])]
}

export function splitPane(
  root: TilingNode,
  targetPaneId: string,
  direction: 'horizontal' | 'vertical'
): { newRoot: TilingNode; newPaneId: string } | null {
  const newPane = createPane()

  function replaceNode(node: TilingNode): TilingNode | null {
    if (node.type === 'pane' && node.id === targetPaneId) {
      const split: SplitNode = {
        type: 'split',
        id: generateSplitId(),
        direction,
        ratio: 0.5,
        children: [node, newPane]
      }
      return split
    }
    if (node.type === 'split') {
      const left = replaceNode(node.children[0])
      if (left) return { ...node, children: [left, node.children[1]] }
      const right = replaceNode(node.children[1])
      if (right) return { ...node, children: [node.children[0], right] }
    }
    return null
  }

  const newRoot = replaceNode(root)
  if (!newRoot) return null
  return { newRoot, newPaneId: newPane.id }
}

export function removePane(root: TilingNode, paneId: string): TilingNode | null {
  if (root.type === 'pane') {
    return root.id === paneId ? null : root
  }

  // If one of the direct children is the target pane, return the other child
  if (root.children[0].type === 'pane' && root.children[0].id === paneId) {
    return root.children[1]
  }
  if (root.children[1].type === 'pane' && root.children[1].id === paneId) {
    return root.children[0]
  }

  // Recurse into children
  const left = removePane(root.children[0], paneId)
  if (left !== root.children[0]) {
    // Pane was found and removed in left subtree
    if (left === null) return root.children[1]
    return { ...root, children: [left, root.children[1]] }
  }
  const right = removePane(root.children[1], paneId)
  if (right !== root.children[1]) {
    if (right === null) return root.children[0]
    return { ...root, children: [root.children[0], right] }
  }

  return root
}

export function updateSplitRatio(root: TilingNode, splitId: string, newRatio: number): TilingNode {
  if (root.type === 'pane') return root
  if (root.id === splitId) {
    return { ...root, ratio: Math.max(0.1, Math.min(0.9, newRatio)) }
  }
  return {
    ...root,
    children: [
      updateSplitRatio(root.children[0], splitId, newRatio),
      updateSplitRatio(root.children[1], splitId, newRatio)
    ]
  }
}

export function getPaneRects(root: TilingNode): Map<string, Rect> {
  const rects = new Map<string, Rect>()

  function walk(node: TilingNode, rect: Rect): void {
    if (node.type === 'pane') {
      rects.set(node.id, rect)
      return
    }
    if (node.direction === 'horizontal') {
      const leftW = rect.w * node.ratio
      walk(node.children[0], { x: rect.x, y: rect.y, w: leftW, h: rect.h })
      walk(node.children[1], { x: rect.x + leftW, y: rect.y, w: rect.w - leftW, h: rect.h })
    } else {
      const topH = rect.h * node.ratio
      walk(node.children[0], { x: rect.x, y: rect.y, w: rect.w, h: topH })
      walk(node.children[1], { x: rect.x, y: rect.y + topH, w: rect.w, h: rect.h - topH })
    }
  }

  walk(root, { x: 0, y: 0, w: 1, h: 1 })
  return rects
}

export function findPaneInDirection(
  root: TilingNode,
  fromPaneId: string,
  direction: Direction
): string | null {
  const rects = getPaneRects(root)
  const fromRect = rects.get(fromPaneId)
  if (!fromRect) return null

  const fromCx = fromRect.x + fromRect.w / 2
  const fromCy = fromRect.y + fromRect.h / 2
  const epsilon = 0.001

  let bestId: string | null = null
  let bestDist = Infinity

  for (const [id, rect] of rects) {
    if (id === fromPaneId) continue

    const cx = rect.x + rect.w / 2
    const cy = rect.y + rect.h / 2

    let isInDirection = false
    let primaryDist = 0
    let perpDist = 0

    switch (direction) {
      case 'right':
        isInDirection = rect.x >= fromRect.x + fromRect.w - epsilon
        primaryDist = cx - fromCx
        perpDist = Math.abs(cy - fromCy)
        break
      case 'left':
        isInDirection = rect.x + rect.w <= fromRect.x + epsilon
        primaryDist = fromCx - cx
        perpDist = Math.abs(cy - fromCy)
        break
      case 'down':
        isInDirection = rect.y >= fromRect.y + fromRect.h - epsilon
        primaryDist = cy - fromCy
        perpDist = Math.abs(cx - fromCx)
        break
      case 'up':
        isInDirection = rect.y + rect.h <= fromRect.y + epsilon
        primaryDist = fromCy - cy
        perpDist = Math.abs(cx - fromCx)
        break
    }

    if (!isInDirection) continue

    // Prefer closest on perpendicular axis, then primary axis
    const dist = perpDist * 1000 + primaryDist
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }

  return bestId
}

export function movePaneInDirection(root: TilingNode, paneId: string, direction: Direction): TilingNode {
  const parentInfo = findParent(root, paneId)
  if (!parentInfo) return root // pane is root, can't move

  const { parent, childIndex } = parentInfo
  const newDirection: 'horizontal' | 'vertical' =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical'
  // Should focused pane be second child (right/down)?
  const focusedSecond = direction === 'right' || direction === 'down'
  const focusedIndex = focusedSecond ? 1 : 0

  // If already correct direction and position, try to move further up the tree
  if (parent.direction === newDirection && childIndex === focusedIndex) {
    // Already in the right spot in this split — try to swap with neighbor
    const targetId = findPaneInDirection(root, paneId, direction)
    if (!targetId) return root

    // Swap the two panes
    function replacePaneNode(node: TilingNode, fromId: string, to: TilingNode): TilingNode {
      if (node.type === 'pane') return node.id === fromId ? to : node
      return {
        ...node,
        children: [
          replacePaneNode(node.children[0], fromId, to),
          replacePaneNode(node.children[1], fromId, to)
        ]
      }
    }
    const nodeA = findNode(root, paneId)
    const nodeB = findNode(root, targetId)
    if (!nodeA || !nodeB || nodeA.type !== 'pane' || nodeB.type !== 'pane') return root
    const placeholder: PaneNode = { type: 'pane', id: '__swap__', color: '' }
    let tree = replacePaneNode(root, paneId, placeholder)
    tree = replacePaneNode(tree, targetId, nodeA)
    tree = replacePaneNode(tree, '__swap__', nodeB)
    return tree
  }

  // Change direction and/or reorder children
  function updateSplit(node: TilingNode): TilingNode {
    if (node.type === 'pane') return node
    if (node.id === parent.id) {
      const children: [TilingNode, TilingNode] = focusedSecond
        ? [node.children[1 - childIndex], node.children[childIndex]]
        : [node.children[childIndex], node.children[1 - childIndex]]
      return { ...node, direction: newDirection, children }
    }
    return {
      ...node,
      children: [updateSplit(node.children[0]), updateSplit(node.children[1])]
    }
  }

  return updateSplit(root)
}

export function extractPane(
  root: TilingNode,
  paneId: string
): { pane: PaneNode; newRoot: TilingNode | null } | null {
  const node = findNode(root, paneId)
  if (!node || node.type !== 'pane') return null
  const newRoot = removePane(root, paneId)
  return { pane: node, newRoot }
}
