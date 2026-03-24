import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui.js'
import { ColorSchemeType } from 'diff2html/lib/types'
import 'diff2html/bundles/css/diff2html.min.css'
import 'highlight.js/styles/github-dark.css'
import { RefreshCw } from 'lucide-react'
import { GIT_STATUS_POLL_MS } from '../../../../shared/constants'

interface FileStatus {
  path: string
  status: string
  staged: boolean
}

interface ReviewPaneProps {
  paneId: string
  isFocused: boolean
  isVisible: boolean
  cwd?: string
  targetId?: string
  params: Record<string, unknown>
}

const STATUS_LABELS: Record<string, string> = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  '?': 'Untracked'
}

const STATUS_COLORS: Record<string, string> = {
  M: 'var(--accent)',
  A: '#30d158',
  D: '#ff453a',
  R: '#bf5af2',
  C: '#64d2ff',
  '?': 'var(--text-secondary)'
}

const DIFF_UI_CONFIG = {
  outputFormat: 'line-by-line' as const,
  drawFileList: false,
  colorScheme: ColorSchemeType.DARK,
  highlight: true,
  fileContentToggle: false,
  fileListToggle: false,
  stickyFileHeaders: false
}

function renderDiff(container: HTMLElement, diffString: string): void {
  const ui = new Diff2HtmlUI(container, diffString, DIFF_UI_CONFIG)
  ui.draw()
}

export default function ReviewPane({
  isFocused,
  isVisible,
  cwd,
  targetId
}: ReviewPaneProps): React.JSX.Element {
  const [files, setFiles] = useState<FileStatus[]>([])
  const [selectedFile, setSelectedFile] = useState<{
    path: string
    staged: boolean
  } | null>(null)
  const [rawDiff, setRawDiff] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const diffContainerRef = useRef<HTMLDivElement>(null)
  const lastStatusRef = useRef('')
  const selectedFileRef = useRef(selectedFile)

  useEffect(() => {
    selectedFileRef.current = selectedFile
  }, [selectedFile])

  // Render diff2html into DOM when rawDiff changes
  useEffect(() => {
    const el = diffContainerRef.current
    if (!el) return
    if (rawDiff === null) {
      el.innerHTML = ''
      return
    }
    renderDiff(el, rawDiff)
  }, [rawDiff])

  const fetchStatus = useCallback(async () => {
    if (!cwd) return null
    try {
      const result = await window.git.status(cwd, targetId)
      const key = JSON.stringify(result)
      if (key !== lastStatusRef.current) {
        lastStatusRef.current = key
        setFiles(result)
        return result
      }
    } catch {
      setFiles([])
    }
    return null
  }, [cwd, targetId])

  const fetchDiff = useCallback(
    async (filePath: string, staged: boolean) => {
      if (!cwd) return
      try {
        const raw = await window.git.diff(cwd, filePath, staged, targetId)
        if (!raw.trim()) {
          // For untracked/new files, read the working copy and build a synthetic diff
          try {
            const content = await window.git.readWorkingFile(cwd, filePath)
            if (content) {
              const lines = content.split('\n')
              const fakeDiff = [
                `diff --git a/${filePath} b/${filePath}`,
                'new file mode 100644',
                `--- /dev/null`,
                `+++ b/${filePath}`,
                `@@ -0,0 +1,${lines.length} @@`,
                ...lines.map((l) => `+${l}`)
              ].join('\n')
              setRawDiff(fakeDiff)
              return
            }
          } catch {
            // fall through
          }
          setRawDiff(null)
          return
        }
        setRawDiff(raw)
      } catch {
        setRawDiff(null)
      }
    },
    [cwd, targetId]
  )

  // Initial load
  useEffect(() => {
    if (!cwd) return
    let cancelled = false
    const load = async (): Promise<void> => {
      const result = await fetchStatus()
      if (cancelled) return
      setLoading(false)
      if (result && result.length > 0) {
        const first = { path: result[0].path, staged: result[0].staged }
        setSelectedFile(first)
        fetchDiff(first.path, first.staged)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [cwd, fetchStatus, fetchDiff])

  // Auto-refresh polling
  useEffect(() => {
    if (!isVisible || !cwd) return
    const interval = setInterval(async () => {
      const result = await fetchStatus()
      if (result) {
        const sel = selectedFileRef.current
        if (sel) {
          const stillExists = result.some((f) => f.path === sel.path && f.staged === sel.staged)
          if (stillExists) {
            fetchDiff(sel.path, sel.staged)
          } else if (result.length > 0) {
            setSelectedFile({ path: result[0].path, staged: result[0].staged })
          } else {
            setSelectedFile(null)
            setRawDiff(null)
          }
        }
      }
    }, GIT_STATUS_POLL_MS)
    return () => clearInterval(interval)
  }, [isVisible, cwd, fetchStatus, fetchDiff])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await fetchStatus()
    if (selectedFileRef.current) {
      await fetchDiff(selectedFileRef.current.path, selectedFileRef.current.staged)
    }
    setLoading(false)
  }, [fetchStatus, fetchDiff])

  const handleFileClick = useCallback(
    (file: FileStatus) => {
      setSelectedFile({ path: file.path, staged: file.staged })
      fetchDiff(file.path, file.staged)
    },
    [fetchDiff]
  )

  // Group files by staged/unstaged
  const stagedFiles = files.filter((f) => f.staged)
  const unstagedFiles = files.filter((f) => !f.staged)

  // Flat ordered list: staged first, then unstaged (matches visual order)
  const orderedFiles = useMemo(
    () => [...stagedFiles, ...unstagedFiles],
    [stagedFiles, unstagedFiles]
  )

  const selectByDelta = useCallback(
    (delta: number) => {
      if (orderedFiles.length === 0) return
      const sel = selectedFileRef.current
      const currentIdx = sel
        ? orderedFiles.findIndex((f) => f.path === sel.path && f.staged === sel.staged)
        : -1
      const nextIdx =
        currentIdx === -1 ? 0 : (currentIdx + delta + orderedFiles.length) % orderedFiles.length
      const next = orderedFiles[nextIdx]
      setSelectedFile({ path: next.path, staged: next.staged })
      fetchDiff(next.path, next.staged)
    },
    [orderedFiles, fetchDiff]
  )

  // Keyboard navigation: Tab/Shift+Tab/ArrowDown/ArrowUp cycle files
  const paneRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = paneRef.current
    if (!el) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        selectByDelta(1)
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        selectByDelta(-1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        selectByDelta(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        selectByDelta(-1)
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [selectByDelta])

  // Focus the pane container when it becomes the active pane
  useEffect(() => {
    if (isFocused && isVisible && paneRef.current) {
      paneRef.current.focus()
    }
  }, [isFocused, isVisible])

  return (
    <div
      ref={paneRef}
      className="review-pane flex-1 flex flex-col h-full overflow-hidden"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}
        >
          Review
        </span>
        <button
          onClick={handleRefresh}
          className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File list */}
        <div
          className="w-[250px] shrink-0 overflow-y-auto border-r"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          {files.length === 0 && !loading && (
            <div
              className="p-4 text-center text-xs"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}
            >
              No uncommitted changes
            </div>
          )}

          {stagedFiles.length > 0 && (
            <FileSection
              label="Staged"
              files={stagedFiles}
              selectedFile={selectedFile}
              onFileClick={handleFileClick}
            />
          )}

          {unstagedFiles.length > 0 && (
            <FileSection
              label="Changes"
              files={unstagedFiles}
              selectedFile={selectedFile}
              onFileClick={handleFileClick}
            />
          )}
        </div>

        {/* Diff view — ref div is managed imperatively by Diff2HtmlUI, so
             React must never place children inside it. Empty/loading states
             are rendered as siblings that overlay when rawDiff is null. */}
        <div
          className="flex-1 overflow-auto review-diff-container relative"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div ref={diffContainerRef} style={{ display: rawDiff !== null ? 'block' : 'none' }} />
          {rawDiff === null && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem'
              }}
            >
              {loading ? 'Loading...' : 'Select a file to view changes'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileSection({
  label,
  files,
  selectedFile,
  onFileClick
}: {
  label: string
  files: FileStatus[]
  selectedFile: { path: string; staged: boolean } | null
  onFileClick: (file: FileStatus) => void
}): React.JSX.Element {
  return (
    <div>
      <div
        className="px-3 py-1 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}
      >
        {label}
      </div>
      {files.map((file) => {
        const isSelected = selectedFile?.path === file.path && selectedFile?.staged === file.staged
        const statusColor = STATUS_COLORS[file.status] ?? 'var(--text-secondary)'
        const fileName = file.path.split('/').pop() ?? file.path
        const dirPath = file.path.includes('/')
          ? file.path.slice(0, file.path.lastIndexOf('/'))
          : ''

        return (
          <button
            key={`${file.path}-${file.staged}`}
            onClick={() => onFileClick(file)}
            className="w-full flex items-center gap-2 px-3 py-1 text-left text-xs transition-colors hover:bg-[var(--bg-secondary)]"
            style={{
              backgroundColor: isSelected ? 'var(--bg-tertiary)' : undefined,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)'
            }}
            title={`${STATUS_LABELS[file.status] ?? file.status}: ${file.path}`}
          >
            <span
              className="shrink-0 w-4 text-center font-bold text-[10px]"
              style={{ color: statusColor }}
            >
              {file.status}
            </span>
            <span className="truncate">
              {fileName}
              {dirPath && (
                <span style={{ color: 'var(--text-secondary)' }}> {dirPath}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
