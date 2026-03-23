import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import {
  TERMINAL_FONT_SIZE,
  TERMINAL_LINE_HEIGHT,
  TERMINAL_FONT_FAMILY,
  TERMINAL_THEME,
  TERMINAL_PADDING,
  RESIZE_DEBOUNCE_MS,
  REFIT_DELAY_MS
} from '../../../../shared/constants'
import {
  registerPty,
  isPtyActive,
  unregisterPty,
  registerFitAddon,
  unregisterFitAddon,
  getFitAddon
} from '../../lib/pty-registry'

interface TerminalPaneProps {
  paneId: string
  isFocused: boolean
  isVisible: boolean
  cwd?: string
}

export default function TerminalPane({
  paneId,
  isFocused,
  isVisible,
  cwd
}: TerminalPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)

  // Create terminal and PTY
  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: TERMINAL_FONT_SIZE,
      fontFamily: TERMINAL_FONT_FAMILY,
      lineHeight: TERMINAL_LINE_HEIGHT,
      theme: TERMINAL_THEME,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    terminalRef.current = terminal
    registerFitAddon(paneId, fitAddon)

    let disposed = false
    let ptyReady = false

    const removeDataListener = window.pty.onData((id, data) => {
      if (id === paneId && !disposed) {
        terminal.write(data)
      }
    })

    const removeExitListener = window.pty.onExit((id, exitCode) => {
      if (id === paneId && !disposed && ptyReady) {
        terminal.write(`\r\n[Process exited with code ${exitCode}]`)
        unregisterPty(paneId)
      }
    })

    terminal.attachCustomKeyEventHandler((e) => {
      if (e.ctrlKey && e.key === 'c' && e.type === 'keydown' && terminal.hasSelection()) {
        navigator.clipboard.writeText(terminal.getSelection())
        terminal.clearSelection()
        return false
      }
      if (e.ctrlKey && e.key === 'v' && e.type === 'keydown') {
        navigator.clipboard.readText().then((text) => {
          if (text && isPtyActive(paneId)) {
            window.pty.write(paneId, text)
          }
        })
        return false
      }
      if (e.altKey && e.type === 'keydown') {
        return false
      }
      return true
    })

    registerPty(paneId)
    window.pty.create(paneId, cwd).then(() => {
      if (disposed) return
      ptyReady = true
      fitAddon.fit()
      window.pty.resize(paneId, terminal.cols, terminal.rows)
    })

    const inputDisposable = terminal.onData((data) => {
      if (ptyReady && isPtyActive(paneId)) {
        window.pty.write(paneId, data)
      }
    })

    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        try {
          fitAddon.fit()
          if (ptyReady && isPtyActive(paneId)) {
            window.pty.resize(paneId, terminal.cols, terminal.rows)
          }
        } catch {
          // Expected during teardown
        }
      }, RESIZE_DEBOUNCE_MS)
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      disposed = true
      inputDisposable.dispose()
      removeDataListener()
      removeExitListener()
      resizeObserver.disconnect()
      if (resizeTimer) clearTimeout(resizeTimer)
      terminal.dispose()
      terminalRef.current = null
      unregisterFitAddon(paneId)
    }
  }, [paneId])

  // Refit when workspace becomes visible
  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => {
      const addon = getFitAddon(paneId)
      if (addon && isPtyActive(paneId)) {
        try {
          addon.fit()
          const term = terminalRef.current
          if (term) {
            window.pty.resize(paneId, term.cols, term.rows)
          }
        } catch {
          // Expected during teardown
        }
      }
    }, REFIT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isVisible, paneId])

  // Focus terminal when pane is focused or becomes visible
  useEffect(() => {
    if (isFocused && isVisible && terminalRef.current) {
      terminalRef.current.focus()
    }
  }, [isFocused, isVisible])

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full"
      style={{ padding: `${TERMINAL_PADDING}px` }}
    />
  )
}
