import { useState, useEffect, useRef, useCallback } from 'react'
import { useTilingStore } from '../../stores/tiling-store'
import { Button } from '../ui/button'
import WorktreeSelector, { type WorktreeSelectorHandle } from './WorktreeSelector'
import { GIT_REPO_CHECK_DEBOUNCE_MS } from '../../../../shared/constants'

interface TargetInfo {
  id: string
  label: string
}

interface WorkspaceSetupProps {
  workspaceNumber: number
}

export default function WorkspaceSetup({
  workspaceNumber
}: WorkspaceSetupProps): React.JSX.Element {
  const cwd = useTilingStore((s) => s.workspaces[workspaceNumber]?.cwd ?? '')
  const currentTargetId = useTilingStore((s) => s.workspaces[workspaceNumber]?.targetId ?? '')
  const isActive = useTilingStore((s) => s.activeWorkspace === workspaceNumber)
  const hasLayout = useTilingStore((s) => s.workspaces[workspaceNumber]?.layout !== null)
  const setWorkspaceCwd = useTilingStore((s) => s.setWorkspaceCwd)
  const setWorkspaceTarget = useTilingStore((s) => s.setWorkspaceTarget)
  const [inputValue, setInputValue] = useState(cwd)
  const [homedir, setHomedir] = useState('')
  const [targets, setTargets] = useState<TargetInfo[]>([])
  const [selectedTarget, setSelectedTarget] = useState(currentTargetId)
  const [gitAvailable, setGitAvailable] = useState<boolean | null>(null)
  const [isGitRepo, setIsGitRepo] = useState(false)
  const [resolvedRepoPath, setResolvedRepoPath] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const worktreeSelectorRef = useRef<WorktreeSelectorHandle>(null)
  const internalCwdUpdate = useRef(false)

  useEffect(() => {
    window.targets.getAvailable().then(setTargets)
    window.targets.getDefaultId().then((defaultId) => {
      if (!currentTargetId) {
        setSelectedTarget(defaultId)
        setWorkspaceTarget(defaultId)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedTarget) {
      window.dialog.getHomedir(selectedTarget).then((h) => {
        setHomedir(h.replace(/[\\/]+$/, ''))
      })
    }
  }, [selectedTarget])

  useEffect(() => {
    if (internalCwdUpdate.current) {
      internalCwdUpdate.current = false
      return
    }
    // Convert absolute cwd to relative for display when it's under homedir
    if (homedir && cwd === homedir) {
      setInputValue('')
    } else if (homedir && (cwd.startsWith(`${homedir}/`) || cwd.startsWith(`${homedir}\\`))) {
      setInputValue(cwd.slice(homedir.length + 1))
    } else {
      setInputValue(cwd)
    }
  }, [cwd])

  useEffect(() => {
    if (currentTargetId && currentTargetId !== selectedTarget) {
      setSelectedTarget(currentTargetId)
    }
  }, [currentTargetId])

  useEffect(() => {
    if (isActive && !hasLayout) {
      inputRef.current?.focus()
    }
  }, [isActive, hasLayout])

  // Check git availability when target changes
  useEffect(() => {
    if (!selectedTarget) return
    let cancelled = false
    setGitAvailable(null)
    setIsGitRepo(false)
    window.git.isInstalled(selectedTarget).then((v) => {
      if (!cancelled) setGitAvailable(v)
    })
    return () => {
      cancelled = true
    }
  }, [selectedTarget])

  // Debounced git repo check when input changes
  const resolvePath = useCallback(
    (value: string): string => {
      const s = homedir.includes('\\') ? '\\' : '/'
      const abs = value.startsWith('/') || /^[a-zA-Z]:\\/.test(value)
      return value.trim() ? (abs ? value.trim() : `${homedir}${s}${value.trim()}`) : homedir
    },
    [homedir]
  )

  useEffect(() => {
    if (!homedir) {
      setIsGitRepo(false)
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      const fullPath = resolvePath(inputValue)
      // Keep store cwd in sync with the input so the command palette sees the current path
      internalCwdUpdate.current = true
      setWorkspaceCwd(fullPath)
      setResolvedRepoPath(fullPath)
      if (gitAvailable === true) {
        window.git.isRepo(fullPath, selectedTarget).then((v) => {
          if (!cancelled) setIsGitRepo(v)
        })
      } else {
        setIsGitRepo(false)
      }
    }, GIT_REPO_CHECK_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inputValue, gitAvailable, selectedTarget, homedir, resolvePath, setWorkspaceCwd])

  const sep = homedir.includes('\\') ? '\\' : '/'
  const isAbsolute = (p: string): boolean => p.startsWith('/') || /^[a-zA-Z]:\\/.test(p)

  const handleTargetChange = (targetId: string): void => {
    setSelectedTarget(targetId)
    setWorkspaceTarget(targetId)
  }

  const handleInputKeyDown = async (e: React.KeyboardEvent): Promise<void> => {
    if (e.key === 'ArrowDown' && gitAvailable === true && isGitRepo) {
      e.preventDefault()
      worktreeSelectorRef.current?.focus()
      return
    }
    if (e.key !== 'Tab') return
    e.preventDefault()

    const value = inputValue || ''
    const fullPath = isAbsolute(value) ? value : `${homedir}${sep}${value}`
    const lastSep = Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\'))
    const parentDir = fullPath.slice(0, lastSep) || sep
    const partial = fullPath.slice(lastSep + 1)

    const entries = await window.dialog.listDir(parentDir, selectedTarget)
    const matches = entries.filter((name) => name.startsWith(partial))

    if (matches.length === 0) return

    let prefix = matches[0]
    for (let i = 1; i < matches.length; i++) {
      let j = 0
      while (j < prefix.length && j < matches[i].length && prefix[j] === matches[i][j]) j++
      prefix = prefix.slice(0, j)
    }

    const completion = matches.length === 1 ? `${prefix}${sep}` : prefix
    const newFull = `${parentDir}${sep}${completion}`
    const homedirPrefix = `${homedir}${sep}`
    const relative = newFull.startsWith(homedirPrefix)
      ? newFull.slice(homedirPrefix.length)
      : newFull
    setInputValue(relative)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const homedirPrefix = `${homedir}${sep}`
    const fullPath = inputValue.trim()
      ? isAbsolute(inputValue)
        ? inputValue.trim()
        : `${homedir}${sep}${inputValue.trim()}`
      : homedir
    if (fullPath) {
      setWorkspaceCwd(fullPath)
      setInputValue(
        fullPath.startsWith(homedirPrefix) ? fullPath.slice(homedirPrefix.length) : fullPath
      )
    }
  }

  const splitFocusedPane = useTilingStore((s) => s.splitFocusedPane)

  const handleWorktreeSelect = (worktreePath: string): void => {
    setWorkspaceCwd(worktreePath)
    const homedirPrefix = `${homedir}${sep}`
    setInputValue(
      worktreePath.startsWith(homedirPrefix)
        ? worktreePath.slice(homedirPrefix.length)
        : worktreePath
    )
    splitFocusedPane()
  }

  const handleBrowse = async (): Promise<void> => {
    const path = await window.dialog.openFolder()
    if (path) {
      const homedirPrefix = `${homedir}${sep}`
      setWorkspaceCwd(path)
      setInputValue(path.startsWith(homedirPrefix) ? path.slice(homedirPrefix.length) : path)
    }
  }

  const homedirPrefixDisplay = `${homedir}${sep}`
  const displayValue = (() => {
    if (!cwd || inputValue !== cwd) return inputValue
    if (cwd === homedir) return ''
    if (cwd.startsWith(homedirPrefixDisplay)) return cwd.slice(homedirPrefixDisplay.length)
    return inputValue
  })()

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {targets.length > 1 && (
        <div className="flex gap-1 mb-4">
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTargetChange(t.id)}
              className="px-3 py-1 text-xs rounded-md transition-colors"
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                backgroundColor:
                  selectedTarget === t.id ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                color: selectedTarget === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-stretch rounded-md border border-[var(--border)] overflow-hidden focus-within:border-[var(--border-focus)]">
          <span className="flex items-center px-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] font-[family-name:var(--font-mono)] select-none whitespace-nowrap">
            {homedir || '~'}
            {homedir.includes('\\') ? '\\' : '/'}
          </span>
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="project"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="w-[300px] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] font-[family-name:var(--font-mono)] placeholder:text-[var(--text-secondary)] focus:outline-none border-none"
          />
        </div>
        <Button type="button" variant="secondary" size="default" onClick={handleBrowse}>
          Browse
        </Button>
      </form>
      {gitAvailable === false && (
        <p className="mt-3 text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
          git is not installed
        </p>
      )}
      {gitAvailable === true && isGitRepo && (
        <WorktreeSelector
          ref={worktreeSelectorRef}
          repoPath={resolvedRepoPath}
          targetId={selectedTarget}
          onSelect={handleWorktreeSelect}
          onFocusPath={() => inputRef.current?.focus()}
        />
      )}
      <p className="mt-4 text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
        Alt+Enter to open terminal · Alt+D to open launcher
        {gitAvailable === true && isGitRepo && ' · ↓ worktrees'}
        {gitAvailable === true && !isGitRepo && ' · pick a git repository to manage worktrees'}
      </p>
    </div>
  )
}
