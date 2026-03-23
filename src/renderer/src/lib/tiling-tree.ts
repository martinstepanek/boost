import type { PaneNode, SplitNode, TilingNode, Direction, Rect } from '../../../shared/types'
import {
  PANE_COLORS,
  SPLIT_RATIO_MIN,
  SPLIT_RATIO_MAX,
  DIRECTION_EPSILON,
  DIRECTION_PERP_WEIGHT
} from '../../../shared/constants'

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function randomColor(): string {
  return PANE_COLORS[Math.floor(Math.random() * PANE_COLORS.length)]
}

export function createPane(
  app: string = 'terminal',
  params: Record<string, unknown> = {},
  splitDirection: 'horizontal' | 'vertical' = 'horizontal'
): PaneNode {
  return { type: 'pane', id: generateId('pane'), color: randomColor(), app, params, splitDirection }
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
  nodeId: string
): { parent: SplitNode; childIndex: 0 | 1 } | null {
  if (root.type === 'pane') return null
  for (const idx of [0, 1] as const) {
    const child = root.children[idx]
    if (child.id === nodeId) {
      return { parent: root, childIndex: idx }
    }
    const result = findParent(child, nodeId)
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
      return {
        type: 'split',
        id: generateId('split'),
        direction,
        ratio: 0.5,
        children: [node, newPane]
      }
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

  if (root.children[0].type === 'pane' && root.children[0].id === paneId) {
    return root.children[1]
  }
  if (root.children[1].type === 'pane' && root.children[1].id === paneId) {
    return root.children[0]
  }

  const left = removePane(root.children[0], paneId)
  if (left !== root.children[0]) {
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
    return { ...root, ratio: Math.max(SPLIT_RATIO_MIN, Math.min(SPLIT_RATIO_MAX, newRatio)) }
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
        isInDirection = rect.x >= fromRect.x + fromRect.w - DIRECTION_EPSILON
        primaryDist = cx - fromCx
        perpDist = Math.abs(cy - fromCy)
        break
      case 'left':
        isInDirection = rect.x + rect.w <= fromRect.x + DIRECTION_EPSILON
        primaryDist = fromCx - cx
        perpDist = Math.abs(cy - fromCy)
        break
      case 'down':
        isInDirection = rect.y >= fromRect.y + fromRect.h - DIRECTION_EPSILON
        primaryDist = cy - fromCy
        perpDist = Math.abs(cx - fromCx)
        break
      case 'up':
        isInDirection = rect.y + rect.h <= fromRect.y + DIRECTION_EPSILON
        primaryDist = fromCy - cy
        perpDist = Math.abs(cx - fromCx)
        break
    }

    if (!isInDirection) continue

    const dist = perpDist * DIRECTION_PERP_WEIGHT + primaryDist
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }

  return bestId
}

function replacePaneNode(root: TilingNode, fromId: string, to: TilingNode): TilingNode {
  if (root.type === 'pane') return root.id === fromId ? to : root
  return {
    ...root,
    children: [
      replacePaneNode(root.children[0], fromId, to),
      replacePaneNode(root.children[1], fromId, to)
    ]
  }
}

function swapPanes(root: TilingNode, idA: string, idB: string): TilingNode {
  const nodeA = findNode(root, idA)
  const nodeB = findNode(root, idB)
  if (!nodeA || !nodeB || nodeA.type !== 'pane' || nodeB.type !== 'pane') return root

  const placeholderId = generateId('swap')
  const placeholder: PaneNode = {
    type: 'pane',
    id: placeholderId,
    color: '',
    app: 'terminal',
    params: {},
    splitDirection: 'horizontal'
  }
  let tree = replacePaneNode(root, idA, placeholder)
  tree = replacePaneNode(tree, idB, nodeA)
  tree = replacePaneNode(tree, placeholderId, nodeB)
  return tree
}

export function movePaneInDirection(
  root: TilingNode,
  paneId: string,
  direction: Direction
): TilingNode {
  const parentInfo = findParent(root, paneId)
  if (!parentInfo) return root

  const { parent, childIndex } = parentInfo
  const newDirection: 'horizontal' | 'vertical' =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical'
  const focusedSecond = direction === 'right' || direction === 'down'
  const focusedIndex = focusedSecond ? 1 : 0

  if (parent.direction === newDirection && childIndex === focusedIndex) {
    const targetId = findPaneInDirection(root, paneId, direction)
    if (!targetId) return root
    return swapPanes(root, paneId, targetId)
  }

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

export function updatePaneInTree(
  root: TilingNode,
  paneId: string,
  updater: (pane: PaneNode) => PaneNode
): TilingNode {
  if (root.type === 'pane') {
    return root.id === paneId ? updater(root) : root
  }
  const left = updatePaneInTree(root.children[0], paneId, updater)
  const right = updatePaneInTree(root.children[1], paneId, updater)
  if (left === root.children[0] && right === root.children[1]) return root
  return { ...root, children: [left, right] }
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
