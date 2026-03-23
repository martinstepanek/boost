import { useMemo, useSyncExternalStore } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds, findNode } from '../../lib/tiling-tree'
import { paneRectStore } from '../../lib/pane-rect-store'
import TerminalPane from './TerminalPane'

interface PaneInfo {
  id: string
  cwd: string
  app: string
  params: string // JSON-serialized for stable key
}

export default function TerminalOverlay(): React.JSX.Element {
  const rects = useSyncExternalStore(
    (cb) => paneRectStore.subscribe(cb),
    () => paneRectStore.getSnapshot()
  )

  const focusedPaneId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.focusedPaneId)

  const allPanesKey = useTilingStore((s) => {
    const parts: string[] = []
    for (const ws of Object.values(s.workspaces)) {
      if (ws.layout === null) continue
      const ids = getAllPaneIds(ws.layout)
      for (const id of ids) {
        const node = findNode(ws.layout, id)
        const app = node?.type === 'pane' ? node.app : 'terminal'
        const params = node?.type === 'pane' ? JSON.stringify(node.params) : '{}'
        parts.push(`${id}\t${ws.cwd}\t${app}\t${params}`)
      }
    }
    return parts.join('\n')
  })

  const allPanes: PaneInfo[] = useMemo(() => {
    if (!allPanesKey) return []
    return allPanesKey.split('\n').map((line) => {
      const firstTab = line.indexOf('\t')
      const secondTab = line.indexOf('\t', firstTab + 1)
      const thirdTab = line.indexOf('\t', secondTab + 1)
      return {
        id: line.slice(0, firstTab),
        cwd: line.slice(firstTab + 1, secondTab),
        app: line.slice(secondTab + 1, thirdTab),
        params: line.slice(thirdTab + 1)
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
      {allPanes.map(({ id, cwd, app, params }) => {
        const rect = rects.get(id)
        const isVisible = activeSet.has(id) && !!rect && rect.w > 0
        const parsedParams = JSON.parse(params) as Record<string, unknown>
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
              app={app}
              params={parsedParams}
            />
          </div>
        )
      })}
    </>
  )
}
