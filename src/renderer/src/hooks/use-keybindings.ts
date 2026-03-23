import { useEffect } from 'react'
import { useTilingStore } from '../stores/tiling-store'
import type { Direction } from '../../../shared/types'

const DIRECTION_MAP: Record<string, Direction> = {
  h: 'left',
  j: 'down',
  k: 'up',
  l: 'right',
  arrowleft: 'left',
  arrowdown: 'down',
  arrowup: 'up',
  arrowright: 'right'
}

export function useKeybindings(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (!e.altKey) return

      const store = useTilingStore.getState()
      const key = e.key.toLowerCase()
      const code = e.code
      const shift = e.shiftKey

      // Workspace switching: Super+Shift+1-9 (move pane) or Super+1-9 (switch)
      // Use e.code since shift changes e.key on some layouts
      if (code >= 'Digit1' && code <= 'Digit9') {
        const n = parseInt(code.slice(5))
        e.preventDefault()
        if (shift) {
          store.moveFocusedPaneToWorkspace(n)
        } else {
          store.switchWorkspace(n)
        }
        return
      }

      // Split
      if (!shift && key === 'b') {
        e.preventDefault()
        store.splitFocusedPane('horizontal')
        return
      }
      if (!shift && key === 'v') {
        e.preventDefault()
        store.splitFocusedPane('vertical')
        return
      }

      // Close pane
      if (shift && key === 'q') {
        e.preventDefault()
        store.closeFocusedPane()
        return
      }

      // Focus navigation
      const direction = DIRECTION_MAP[key]
      if (!shift && direction) {
        e.preventDefault()
        store.moveFocus(direction)
        return
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])
}
