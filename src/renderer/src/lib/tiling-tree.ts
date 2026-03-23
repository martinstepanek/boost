import type {
  PaneNode,
  SplitNode,
  TabNode,
  TilingNode,
  Direction,
  Rect
} from '../../../shared/types'
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

// --- Node queries ---

export function findNode(root: TilingNode, id: string): TilingNode | null {
  if (root.id === id) return root
  if (root.type === 'pane') return null
  if (root.type === 'tab') {
    for (const child of root.children) {
      const found = findNode(child, id)
      if (found) return found
    }
    return null
  }
  // split
  return findNode(root.children[0], id) || findNode(root.children[1], id)
}

export function findParent(
  root: TilingNode,
  nodeId: string
): { parent: SplitNode | TabNode; childIndex: number } | null {
  if (root.type === 'pane') return null
  if (root.type === 'tab') {
    for (let i = 0; i < root.children.length; i++) {
      if (root.children[i].id === nodeId) return { parent: root, childIndex: i }
      const result = findParent(root.children[i], nodeId)
      if (result) return result
    }
    return null
  }
  // split
  for (const idx of [0, 1] as const) {
    if (root.children[idx].id === nodeId) return { parent: root, childIndex: idx }
    const result = findParent(root.children[idx], nodeId)
    if (result) return result
  }
  return null
}

export function getAllPaneIds(root: TilingNode): string[] {
  if (root.type === 'pane') return [root.id]
  if (root.type === 'tab') {
    return root.children.map((c) => c.id)
  }
  return [...getAllPaneIds(root.children[0]), ...getAllPaneIds(root.children[1])]
}

// --- Tree mutations ---

export function splitPane(
  root: TilingNode,
  targetPaneId: string,
  direction: 'horizontal' | 'vertical'
): { newRoot: TilingNode; newPaneId: string } | null {
  const newPane = createPane()

  // If target is inside a tab group, add as new tab instead
  const parentInfo = findParent(root, targetPaneId)
  if (parentInfo && parentInfo.parent.type === 'tab') {
    const tab = parentInfo.parent
    const newChildren = [...tab.children, newPane]
    const newTab: TabNode = { ...tab, children: newChildren, activeIndex: newChildren.length - 1 }
    const newRoot = replaceNodeInTree(root, tab.id, newTab)
    return { newRoot, newPaneId: newPane.id }
  }

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

  if (root.type === 'tab') {
    const idx = root.children.findIndex((c) => c.id === paneId)
    if (idx === -1) return root
    const newChildren = root.children.filter((_, i) => i !== idx)
    if (newChildren.length === 0) return null
    if (newChildren.length === 1) return newChildren[0]
    const newActiveIndex = Math.min(root.activeIndex, newChildren.length - 1)
    return { ...root, children: newChildren, activeIndex: newActiveIndex }
  }

  // split
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
  if (root.type === 'split' && root.id === splitId) {
    return { ...root, ratio: Math.max(SPLIT_RATIO_MIN, Math.min(SPLIT_RATIO_MAX, newRatio)) }
  }
  if (root.type === 'tab') {
    // Tab children are panes — no split ratios to update
    return root
  }
  return {
    ...root,
    children: [
      updateSplitRatio(root.children[0], splitId, newRatio),
      updateSplitRatio(root.children[1], splitId, newRatio)
    ]
  }
}

// --- Rect calculation ---

export function getPaneRects(root: TilingNode): Map<string, Rect> {
  const rects = new Map<string, Rect>()

  function walk(node: TilingNode, rect: Rect): void {
    if (node.type === 'pane') {
      rects.set(node.id, rect)
      return
    }
    if (node.type === 'tab') {
      // Only the active child gets the rect
      if (node.children.length > 0) {
        const activeChild = node.children[node.activeIndex] ?? node.children[0]
        walk(activeChild, rect)
      }
      return
    }
    // split
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

// --- Focus navigation ---

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

// --- Node replacement helpers ---

function replaceNodeInTree(root: TilingNode, nodeId: string, replacement: TilingNode): TilingNode {
  if (root.id === nodeId) return replacement
  if (root.type === 'pane') return root
  if (root.type === 'tab') {
    if (root.children.some((c) => c.id === nodeId)) {
      // Replacing a pane inside tab — the tab will be replaced by the caller
      return root
    }
    return root
  }
  return {
    ...root,
    children: [
      replaceNodeInTree(root.children[0], nodeId, replacement),
      replaceNodeInTree(root.children[1], nodeId, replacement)
    ]
  }
}

function replacePaneNode(root: TilingNode, fromId: string, to: TilingNode): TilingNode {
  if (root.type === 'pane') return root.id === fromId ? to : root
  if (root.type === 'tab') {
    const newChildren = root.children.map((c) => replacePaneNode(c, fromId, to)) as PaneNode[]
    return { ...root, children: newChildren }
  }
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

// --- Pane movement ---

export function movePaneInDirection(
  root: TilingNode,
  paneId: string,
  direction: Direction
): TilingNode {
  const parentInfo = findParent(root, paneId)
  if (!parentInfo || parentInfo.parent.type === 'tab') return root

  const parent = parentInfo.parent as SplitNode
  const childIndex = parentInfo.childIndex as 0 | 1
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
    if (node.type === 'tab') return node
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

// --- Pane update ---

export function updatePaneInTree(
  root: TilingNode,
  paneId: string,
  updater: (pane: PaneNode) => PaneNode
): TilingNode {
  if (root.type === 'pane') {
    return root.id === paneId ? updater(root) : root
  }
  if (root.type === 'tab') {
    const newChildren = root.children.map((c) => (c.id === paneId ? updater(c) : c))
    const changed = newChildren.some((c, i) => c !== root.children[i])
    if (!changed) return root
    return { ...root, children: newChildren }
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

// --- Tab operations ---

function collectPanes(node: TilingNode): PaneNode[] {
  if (node.type === 'pane') return [node]
  if (node.type === 'tab') return node.children
  return [...collectPanes(node.children[0]), ...collectPanes(node.children[1])]
}

export function convertToTabs(root: TilingNode, splitId: string): TilingNode {
  const splitNode = findNode(root, splitId)
  if (!splitNode || splitNode.type !== 'split') return root

  const panes = collectPanes(splitNode)
  if (panes.length < 2) return root

  const tabNode: TabNode = {
    type: 'tab',
    id: generateId('tab'),
    children: panes,
    activeIndex: 0
  }

  return replaceNodeInTree(root, splitId, tabNode)
}

export function convertFromTabs(root: TilingNode, tabId: string): TilingNode {
  const tabNode = findNode(root, tabId)
  if (!tabNode || tabNode.type !== 'tab' || tabNode.children.length < 2) return root

  // Build a balanced binary split tree from tab children
  function buildSplit(nodes: TilingNode[]): TilingNode {
    if (nodes.length === 1) return nodes[0]
    if (nodes.length === 2) {
      return {
        type: 'split',
        id: generateId('split'),
        direction: 'horizontal',
        ratio: 0.5,
        children: [nodes[0], nodes[1]]
      }
    }
    const mid = Math.ceil(nodes.length / 2)
    return {
      type: 'split',
      id: generateId('split'),
      direction: 'horizontal',
      ratio: mid / nodes.length,
      children: [buildSplit(nodes.slice(0, mid)), buildSplit(nodes.slice(mid))]
    }
  }

  const split = buildSplit(tabNode.children)
  return replaceNodeInTree(root, tabId, split)
}

export function switchTab(root: TilingNode, tabId: string, delta: number): TilingNode {
  const tabNode = findNode(root, tabId)
  if (!tabNode || tabNode.type !== 'tab') return root

  const len = tabNode.children.length
  const newIndex = (((tabNode.activeIndex + delta) % len) + len) % len
  return replaceNodeInTree(root, tabId, { ...tabNode, activeIndex: newIndex })
}

export function extractPaneFromTab(
  root: TilingNode,
  paneId: string,
  direction: Direction
): TilingNode {
  const tab = findTabContaining(root, paneId)
  if (!tab) return root

  const paneNode = findNode(root, paneId)
  if (!paneNode || paneNode.type !== 'pane') return root

  // Remove pane from tab
  const remainingChildren = tab.children.filter((c) => c.id !== paneId)
  let remainingNode: TilingNode
  if (remainingChildren.length === 0) return root
  if (remainingChildren.length === 1) {
    remainingNode = remainingChildren[0]
  } else {
    remainingNode = {
      ...tab,
      children: remainingChildren,
      activeIndex: Math.min(tab.activeIndex, remainingChildren.length - 1)
    }
  }

  // Create a split with the remaining tab on one side and the pane on the other
  const splitDirection: 'horizontal' | 'vertical' =
    direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical'
  const paneSecond = direction === 'right' || direction === 'down'

  const newSplit: SplitNode = {
    type: 'split',
    id: generateId('split'),
    direction: splitDirection,
    ratio: 0.5,
    children: paneSecond ? [remainingNode, paneNode] : [paneNode, remainingNode]
  }

  return replaceNodeInTree(root, tab.id, newSplit)
}

export function findTabContaining(root: TilingNode, paneId: string): TabNode | null {
  if (root.type === 'pane') return null
  if (root.type === 'tab') {
    for (const child of root.children) {
      if (child.type === 'pane' && child.id === paneId) return root
      const found = findTabContaining(child, paneId)
      if (found) return found
    }
    return null
  }
  return findTabContaining(root.children[0], paneId) || findTabContaining(root.children[1], paneId)
}
