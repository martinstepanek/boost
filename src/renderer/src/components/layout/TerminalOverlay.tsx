import { useMemo, useSyncExternalStore } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds, findNode } from '../../lib/tiling-tree'
import { paneRectStore } from '../../lib/pane-rect-store'
import TerminalPane from './TerminalPane'
import type { PaneCommand } from '../../../../shared/types'

interface PaneInfo {
  id: string
  cwd: string
  command?: PaneCommand
}

export default function TerminalOverlay(): React.JSX.Element {
  const rects = useSyncExternalStore(
    (cb) => paneRectStore.subscribe(cb),
    () => paneRectStore.getSnapshot()
  )

  const focusedPaneId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.focusedPaneId)

  // Stable string key per pane: id\tcwd\tcmd\targs
  const allPanesKey = useTilingStore((s) => {
    const parts: string[] = []
    for (const ws of Object.values(s.workspaces)) {
      if (ws.layout === null) continue
      const ids = getAllPaneIds(ws.layout)
      for (const id of ids) {
        const node = findNode(ws.layout, id)
        const cmd = node?.type === 'pane' && node.command ? node.command.cmd : ''
        const args = node?.type === 'pane' && node.command ? node.command.args.join(' ') : ''
        parts.push(`${id}\t${ws.cwd}\t${cmd}\t${args}`)
      }
    }
    return parts.join('\n')
  })

  const allPanes: PaneInfo[] = useMemo(() => {
    if (!allPanesKey) return []
    return allPanesKey.split('\n').map((line) => {
      const [id, cwd, cmd, args] = line.split('\t')
      return {
        id,
        cwd,
        command: cmd ? { cmd, args: args ? args.split(' ') : [] } : undefined
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
      {allPanes.map(({ id, cwd, command }) => {
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
              command={command}
            />
          </div>
        )
      })}
    </>
  )
}
