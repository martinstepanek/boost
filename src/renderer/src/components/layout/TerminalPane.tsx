import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// Track active PTYs and fit addons so we can clean up / refit
const activePtys = new Set<string>()
const fitAddons = new Map<string, FitAddon>()

export function destroyTerminal(paneId: string): void {
  if (activePtys.has(paneId)) {
    window.pty.close(paneId)
    activePtys.delete(paneId)
  }
  fitAddons.delete(paneId)
}

export function refitTerminal(paneId: string): void {
  const addon = fitAddons.get(paneId)
  if (addon) {
    try {
      addon.fit()
    } catch {
      // ignore
    }
  }
}

interface TerminalPaneProps {
  paneId: string
  isFocused: boolean
  isVisible: boolean
}

export default function TerminalPane({
  paneId,
  isFocused,
  isVisible
}: TerminalPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
      lineHeight: 1.35,
      theme: {
        background: '#1c1c1e',
        foreground: '#e5e5ea',
        cursor: '#0a84ff',
        cursorAccent: '#1c1c1e',
        selectionBackground: 'rgba(10, 132, 255, 0.3)',
        selectionForeground: '#f5f5f7',
        black: '#1c1c1e',
        red: '#ff453a',
        green: '#30d158',
        yellow: '#ffd60a',
        blue: '#0a84ff',
        magenta: '#bf5af2',
        cyan: '#64d2ff',
        white: '#f5f5f7',
        brightBlack: '#48484a',
        brightRed: '#ff6961',
        brightGreen: '#4cd964',
        brightYellow: '#ffdc5c',
        brightBlue: '#409cff',
        brightMagenta: '#da8aff',
        brightCyan: '#70d7ff',
        brightWhite: '#ffffff'
      },
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    terminalRef.current = terminal
    fitAddons.set(paneId, fitAddon)

    let disposed = false
    let ptyReady = false

    // Receive PTY output
    const removeDataListener = window.pty.onData((id, data) => {
      if (id === paneId && !disposed) {
        terminal.write(data)
      }
    })

    // Handle PTY exit
    const removeExitListener = window.pty.onExit((id, exitCode) => {
      if (id === paneId && !disposed && ptyReady) {
        terminal.write(`\r\n[Process exited with code ${exitCode}]`)
        activePtys.delete(paneId)
      }
    })

    // Block app keybindings from reaching xterm, and handle copy
    terminal.attachCustomKeyEventHandler((e) => {
      // Ctrl+C with selection → copy to clipboard
      if (e.ctrlKey && e.key === 'c' && e.type === 'keydown' && terminal.hasSelection()) {
        navigator.clipboard.writeText(terminal.getSelection())
        terminal.clearSelection()
        return false
      }
      // Ctrl+V → paste from clipboard
      if (e.ctrlKey && e.key === 'v' && e.type === 'keydown') {
        navigator.clipboard.readText().then((text) => {
          if (text && activePtys.has(paneId)) {
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

    // Create PTY, then fit
    activePtys.add(paneId)
    window.pty.create(paneId).then(() => {
      if (disposed) return
      ptyReady = true
      fitAddon.fit()
      window.pty.resize(paneId, terminal.cols, terminal.rows)
    })

    // Wire input
    const inputDisposable = terminal.onData((data) => {
      if (ptyReady && activePtys.has(paneId)) {
        window.pty.write(paneId, data)
      }
    })

    // Resize observer
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        try {
          fitAddon.fit()
          if (ptyReady && activePtys.has(paneId)) {
            window.pty.resize(paneId, terminal.cols, terminal.rows)
          }
        } catch {
          // ignore
        }
      }, 50)
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
      fitAddons.delete(paneId)
      // Do NOT close PTY here — only destroyTerminal() does that
    }
  }, [paneId])

  // Refit when workspace becomes visible
  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => {
      const addon = fitAddons.get(paneId)
      if (addon && activePtys.has(paneId)) {
        try {
          addon.fit()
          const term = terminalRef.current
          if (term) {
            window.pty.resize(paneId, term.cols, term.rows)
          }
        } catch {
          // ignore
        }
      }
    }, 10)
    return () => clearTimeout(timer)
  }, [isVisible, paneId])

  // Focus terminal when pane is focused
  useEffect(() => {
    if (isFocused && terminalRef.current) {
      terminalRef.current.focus()
    }
  }, [isFocused])

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full"
      style={{
        padding: '4px'
      }}
    />
  )
}
