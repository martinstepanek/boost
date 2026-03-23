import { useSyncExternalStore } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds } from '../../lib/tiling-tree'
import TerminalPane from './TerminalPane'

interface SimpleRect {
  x: number
  y: number
  w: number
  h: number
}

// Simple external store for pane DOM rects
type Listener = () => void
class PaneRectStoreClass {
  private rects = new Map<string, SimpleRect>()
  private listeners = new Set<Listener>()
  private snapshot = new Map<string, SimpleRect>()

  set(id: string, rect: SimpleRect): void {
    this.rects.set(id, rect)
  }

  delete(id: string): void {
    this.rects.delete(id)
  }

  notify(): void {
    this.snapshot = new Map(this.rects)
    for (const l of this.listeners) l()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): Map<string, SimpleRect> {
    return this.snapshot
  }
}

export const paneRectStore = new PaneRectStoreClass()

export default function TerminalOverlay(): React.JSX.Element {
  const rects = useSyncExternalStore(
    (cb) => paneRectStore.subscribe(cb),
    () => paneRectStore.getSnapshot()
  )

  const focusedPaneId = useTilingStore(
    (s) => s.workspaces[s.activeWorkspace]?.focusedPaneId
  )

  // Collect all pane IDs across all workspaces
  const allPaneIds = useTilingStore(
    useShallow((s) => {
      const ids: string[] = []
      for (const ws of Object.values(s.workspaces)) {
        ids.push(...getAllPaneIds(ws.layout))
      }
      return ids
    })
  )

  // Determine which panes are in the active workspace
  const activePaneIds = useTilingStore(
    useShallow((s) => {
      const ws = s.workspaces[s.activeWorkspace]
      return ws ? getAllPaneIds(ws.layout) : []
    })
  )

  const activeSet = new Set(activePaneIds)

  return (
    <>
      {allPaneIds.map((id) => {
        const rect = rects.get(id)
        const isVisible = activeSet.has(id) && !!rect && rect.w > 0
        return (
          <div
            key={id}
            style={{
              position: 'fixed',
              left: rect?.x ?? 0,
              top: rect?.y ?? 0,
              width: rect?.w ?? 0,
              height: rect?.h ?? 0,
              display: isVisible ? 'flex' : 'none'
            }}
          >
            <TerminalPane
              paneId={id}
              isFocused={id === focusedPaneId}
              isVisible={isVisible}
            />
          </div>
        )
      })}
    </>
  )
}
