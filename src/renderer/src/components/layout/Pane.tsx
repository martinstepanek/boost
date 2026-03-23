import { useEffect, useRef } from 'react'
import type { PaneNode } from '../../../../shared/types'
import { useTilingStore } from '../../stores/tiling-store'
import { paneRectStore } from './TerminalOverlay'

interface PaneProps {
  pane: PaneNode
  isVisible: boolean
}

export default function Pane({ pane, isVisible }: PaneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const isFocused = useTilingStore(
    (s) => s.workspaces[s.activeWorkspace]?.focusedPaneId === pane.id
  )
  const setFocusedPane = useTilingStore((s) => s.setFocusedPane)

  // Report this pane's bounding rect to the overlay
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (): void => {
      const rect = el.getBoundingClientRect()
      paneRectStore.set(pane.id, { x: rect.left, y: rect.top, w: rect.width, h: rect.height })
      paneRectStore.notify()
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)

    // Also update on visibility change
    if (isVisible) {
      requestAnimationFrame(update)
    }

    return () => {
      observer.disconnect()
      paneRectStore.delete(pane.id)
      paneRectStore.notify()
    }
  }, [pane.id, isVisible])

  return (
    <div
      ref={ref}
      className="flex-1 flex"
      style={{
        border: isFocused ? '2px solid #3b82f6' : '2px solid transparent'
      }}
      onMouseDown={() => setFocusedPane(pane.id)}
    />
  )
}
