import { useMemo, useSyncExternalStore } from 'react'
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

  // Build a stable string key of "id:cwd" pairs to avoid new-object-per-render
  const allPanesKey = useTilingStore((s) => {
    const parts: string[] = []
    for (const ws of Object.values(s.workspaces)) {
      if (ws.layout === null) continue
      const ids = getAllPaneIds(ws.layout)
      for (const id of ids) {
        parts.push(`${id}:${ws.cwd}`)
      }
    }
    return parts.join('|')
  })

  const allPanes = useMemo(() => {
    if (!allPanesKey) return []
    return allPanesKey.split('|').map((entry) => {
      const idx = entry.indexOf(':')
      return { id: entry.slice(0, idx), cwd: entry.slice(idx + 1) }
    })
  }, [allPanesKey])

  const activePaneIds = useTilingStore(
    useShallow((s) => {
      const ws = s.workspaces[s.activeWorkspace]
      return ws?.layout ? getAllPaneIds(ws.layout) : []
    })
  )

  const activeSet = new Set(activePaneIds)

  return (
    <>
      {allPanes.map(({ id, cwd }) => {
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
              cwd={cwd}
            />
          </div>
        )
      })}
    </>
  )
}
