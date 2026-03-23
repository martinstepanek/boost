import { useMemo, useSyncExternalStore } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds, findNode } from '../../lib/tiling-tree'
import { paneRectStore } from '../../lib/pane-rect-store'
import TerminalPane from './TerminalPane'

interface PaneInfo {
  id: string
  cwd: string
  targetId: string
  app: string
  params: Record<string, unknown>
}

export default function TerminalOverlay(): React.JSX.Element {
  const rects = useSyncExternalStore(
    (cb) => paneRectStore.subscribe(cb),
    () => paneRectStore.getSnapshot()
  )

  const focusedPaneId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.focusedPaneId)

  // Stable string key per pane: id\tcwd\ttargetId\tapp\tparams(json)
  const allPanesKey = useTilingStore((s) => {
    const parts: string[] = []
    for (const ws of Object.values(s.workspaces)) {
      if (ws.layout === null) continue
      const ids = getAllPaneIds(ws.layout)
      for (const id of ids) {
        const node = findNode(ws.layout, id)
        const app = node?.type === 'pane' ? node.app : 'terminal'
        const params = node?.type === 'pane' ? JSON.stringify(node.params) : '{}'
        parts.push(`${id}\t${ws.cwd}\t${ws.targetId}\t${app}\t${params}`)
      }
    }
    return parts.join('\n')
  })

  const allPanes: PaneInfo[] = useMemo(() => {
    if (!allPanesKey) return []
    return allPanesKey.split('\n').map((line) => {
      const tabs = line.split('\t')
      return {
        id: tabs[0],
        cwd: tabs[1],
        targetId: tabs[2],
        app: tabs[3],
        params: JSON.parse(tabs[4]) as Record<string, unknown>
      }
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
      {allPanes.map(({ id, cwd, targetId, app, params }) => {
        const rect = rects.get(id)
        const isVisible = activeSet.has(id) && !!rect && rect.w > 0
        const isFocused = id === focusedPaneId
        return (
          <div
            key={id}
            style={{
              position: 'fixed',
              left: Math.round(rect?.x ?? 0),
              top: Math.round(rect?.y ?? 0),
              width: Math.round(rect?.w ?? 0),
              height: Math.round(rect?.h ?? 0),
              outline: isFocused ? '1px solid var(--border-focus)' : '1px solid var(--border)',
              outlineOffset: '-1px',
              display: isVisible ? 'flex' : 'none'
            }}
          >
            <TerminalPane
              paneId={id}
              isFocused={id === focusedPaneId}
              isVisible={isVisible}
              cwd={cwd}
              targetId={targetId}
              app={app}
              params={params}
            />
          </div>
        )
      })}
    </>
  )
}
