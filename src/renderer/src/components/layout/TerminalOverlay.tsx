import { useSyncExternalStore } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds } from '../../lib/tiling-tree'
import { paneRectStore } from '../../lib/pane-rect-store'
import TerminalPane from './TerminalPane'

export default function TerminalOverlay(): React.JSX.Element {
  const rects = useSyncExternalStore(
    (cb) => paneRectStore.subscribe(cb),
    () => paneRectStore.getSnapshot()
  )

  const focusedPaneId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.focusedPaneId)

  const allPaneIds = useTilingStore(
    useShallow((s) => {
      const ids: string[] = []
      for (const ws of Object.values(s.workspaces)) {
        ids.push(...getAllPaneIds(ws.layout))
      }
      return ids
    })
  )

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
            <TerminalPane paneId={id} isFocused={id === focusedPaneId} isVisible={isVisible} />
          </div>
        )
      })}
    </>
  )
}
