import { useState, useEffect, useRef } from 'react'
import { useTilingStore } from '../../stores/tiling-store'
import { Button } from '../ui/button'

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
  const inputRef = useRef<HTMLInputElement>(null)

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
    setInputValue(cwd)
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

  const sep = homedir.includes('\\') ? '\\' : '/'
  const isAbsolute = (p: string): boolean => p.startsWith('/') || /^[a-zA-Z]:\\/.test(p)

  const handleTargetChange = (targetId: string): void => {
    setSelectedTarget(targetId)
    setWorkspaceTarget(targetId)
    setInputValue('')
    setWorkspaceCwd('')
  }

  const handleTab = async (e: React.KeyboardEvent): Promise<void> => {
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
      ? isAbsolute(inputValue) ? inputValue.trim() : `${homedir}${sep}${inputValue.trim()}`
      : homedir
    if (fullPath) {
      setWorkspaceCwd(fullPath)
      setInputValue(fullPath.startsWith(homedirPrefix) ? fullPath.slice(homedirPrefix.length) : fullPath)
    }
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
  const displayValue =
    cwd && cwd.startsWith(homedirPrefixDisplay) && inputValue === cwd
      ? cwd.slice(homedirPrefixDisplay.length)
      : inputValue

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
            {homedir || '~'}{homedir.includes('\\') ? '\\' : '/'}
          </span>
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleTab}
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
      <p className="mt-4 text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
        Alt+Enter to open terminal
      </p>
    </div>
  )
}
