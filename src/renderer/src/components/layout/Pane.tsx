import type { PaneNode } from '../../../../shared/types'
import { useTilingStore } from '../../stores/tiling-store'
import { getAllPaneIds } from '../../lib/tiling-tree'

interface PaneProps {
  pane: PaneNode
}

export default function Pane({ pane }: PaneProps): React.JSX.Element {
  const isFocused = useTilingStore(
    (s) => s.workspaces[s.activeWorkspace]?.focusedPaneId === pane.id
  )
  const label = useTilingStore((s) => {
    const ws = s.workspaces[s.activeWorkspace]
    if (!ws) return ''
    const paneIds = getAllPaneIds(ws.layout)
    const index = paneIds.indexOf(pane.id) + 1
    return `${s.activeWorkspace}-${index}`
  })
  const setFocusedPane = useTilingStore((s) => s.setFocusedPane)

  return (
    <div
      className="flex-1 flex items-center justify-center select-none cursor-pointer transition-[border-color] duration-150"
      style={{
        backgroundColor: pane.color,
        border: isFocused ? '2px solid #3b82f6' : '2px solid transparent'
      }}
      onClick={() => setFocusedPane(pane.id)}
    >
      <span className="text-white/60 text-2xl font-mono font-bold">{label}</span>
    </div>
  )
}
