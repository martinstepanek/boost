import { useEffect, useRef } from 'react'
import type { PaneNode } from '../../../../shared/types'
import { useTilingStore } from '../../stores/tiling-store'
import { paneRectStore } from '../../lib/pane-rect-store'
import { subscribeLayoutVersion } from '../../lib/layout-version'

interface PaneProps {
  pane: PaneNode
  isVisible: boolean
}

export default function Pane({ pane, isVisible }: PaneProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const setFocusedPane = useTilingStore((s) => s.setFocusedPane)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = (): void => {
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        paneRectStore.set(pane.id, { x: rect.left, y: rect.top, w: rect.width, h: rect.height })
        paneRectStore.notify()
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)

    // Also update when layout changes (panes repositioned without resize)
    const unsubscribe = subscribeLayoutVersion(update)

    return () => {
      observer.disconnect()
      unsubscribe()
      paneRectStore.delete(pane.id)
      paneRectStore.notify()
    }
  }, [pane.id, isVisible])

  return <div ref={ref} className="flex-1 flex" onMouseDown={() => setFocusedPane(pane.id)} />
}
