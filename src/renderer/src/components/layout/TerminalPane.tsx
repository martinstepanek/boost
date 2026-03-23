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
import { getAppDefinition } from '../../../../shared/app-registry'
import {
  registerPty,
  isPtyActive,
  unregisterPty,
  registerFitAddon,
  unregisterFitAddon,
  getFitAddon
} from '../../lib/pty-registry'
import { useTilingStore } from '../../stores/tiling-store'

const SESSION_POLL_INTERVAL_MS = 2000
const SESSION_POLL_MAX_ATTEMPTS = 15

function pollForClaudeSession(paneId: string, pid: number): void {
  let attempts = 0
  const interval = setInterval(async () => {
    attempts++
    const sessionId = await window.pty.getClaudeSession(pid)
    if (sessionId) {
      clearInterval(interval)
      useTilingStore.getState().setPaneParam(paneId, 'sessionId', sessionId)
    } else if (attempts >= SESSION_POLL_MAX_ATTEMPTS) {
      clearInterval(interval)
    }
  }, SESSION_POLL_INTERVAL_MS)
}

interface TerminalPaneProps {
  paneId: string
  isFocused: boolean
  isVisible: boolean
  cwd?: string
  app: string
  params: Record<string, unknown>
}

export default function TerminalPane({
  paneId,
  isFocused,
  isVisible,
  cwd,
  app,
  params
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

    // Determine what to spawn based on app definition + params
    registerPty(paneId)
    const appDef = getAppDefinition(app)
    let createPty: Promise<number>

    if (appDef?.command) {
      const args = appDef.resolveArgs ? appDef.resolveArgs(params) : appDef.command.args
      createPty = window.pty.createWithCommand(paneId, appDef.command.cmd, args, cwd)
    } else {
      createPty = window.pty.create(paneId, cwd)
    }

    createPty.then((pid) => {
      if (disposed) return
      ptyReady = true
      fitAddon.fit()
      window.pty.resize(paneId, terminal.cols, terminal.rows)

      // Poll for claude session ID if this is a new claude pane (no sessionId yet)
      if (app === 'claude' && !params.sessionId) {
        pollForClaudeSession(paneId, pid)
      }
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
