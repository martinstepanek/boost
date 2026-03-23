import { useEffect } from 'react'
import { useTilingStore } from '../stores/tiling-store'
import type { Direction } from '../../../shared/types'

const DIRECTION_CODE_MAP: Record<string, Direction> = {
  KeyH: 'left',
  KeyJ: 'down',
  KeyK: 'up',
  KeyL: 'right',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowUp: 'up',
  ArrowRight: 'right'
}

export function useKeybindings(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Prevent Alt from activating the Electron menu bar
      if (e.altKey) {
        e.preventDefault()
      }
      if (!e.altKey) return

      const store = useTilingStore.getState()
      const code = e.code
      const shift = e.shiftKey

      // Workspace: Alt+1-9 / Alt+Shift+1-9
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

      // Split direction (per-pane, i3-style)
      if (!shift && code === 'KeyB') {
        e.preventDefault()
        store.setPaneSplitDirection('horizontal')
        return
      }
      if (!shift && code === 'KeyV') {
        e.preventDefault()
        store.setPaneSplitDirection('vertical')
        return
      }

      // Command palette
      if (!shift && code === 'KeyD') {
        e.preventDefault()
        store.toggleCommandPalette()
        return
      }

      // New terminal
      if (!shift && code === 'Enter') {
        e.preventDefault()
        store.splitFocusedPane()
        return
      }

      // Close pane
      if (shift && code === 'KeyQ') {
        e.preventDefault()
        store.closeFocusedPane()
        return
      }

      // Focus navigation / swap panes
      const direction = DIRECTION_CODE_MAP[code]
      if (direction) {
        e.preventDefault()
        if (shift) {
          store.swapFocusedPane(direction)
        } else {
          store.moveFocus(direction)
        }
        return
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])
}
