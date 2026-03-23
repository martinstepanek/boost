import { useState, useEffect, useRef } from 'react'
import { useTilingStore } from '../../stores/tiling-store'
import { Button } from '../ui/button'

interface WorkspaceSetupProps {
  workspaceNumber: number
}

export default function WorkspaceSetup({
  workspaceNumber
}: WorkspaceSetupProps): React.JSX.Element {
  const cwd = useTilingStore((s) => s.workspaces[workspaceNumber]?.cwd ?? '')
  const isActive = useTilingStore((s) => s.activeWorkspace === workspaceNumber)
  const hasLayout = useTilingStore((s) => s.workspaces[workspaceNumber]?.layout !== null)
  const setWorkspaceCwd = useTilingStore((s) => s.setWorkspaceCwd)
  const [inputValue, setInputValue] = useState(cwd)
  const [homedir, setHomedir] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.dialog.getHomedir().then(setHomedir)
  }, [])

  useEffect(() => {
    setInputValue(cwd)
  }, [cwd])

  // Focus input when workspace becomes active and has no terminals
  useEffect(() => {
    if (isActive && !hasLayout) {
      inputRef.current?.focus()
    }
  }, [isActive, hasLayout])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const fullPath = inputValue.trim()
      ? homedir && !inputValue.startsWith('/')
        ? `${homedir}/${inputValue.trim()}`
        : inputValue.trim()
      : homedir
    if (fullPath) {
      setWorkspaceCwd(fullPath)
      setInputValue(fullPath.startsWith(homedir) ? fullPath.slice(homedir.length + 1) : fullPath)
    }
  }

  const handleBrowse = async (): Promise<void> => {
    const path = await window.dialog.openFolder()
    if (path) {
      setWorkspaceCwd(path)
      setInputValue(path.startsWith(homedir) ? path.slice(homedir.length + 1) : path)
    }
  }

  // Show relative path in input if it starts with homedir
  const displayValue =
    cwd && cwd.startsWith(homedir) && inputValue === cwd
      ? cwd.slice(homedir.length + 1)
      : inputValue

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-stretch rounded-md border border-[var(--border)] overflow-hidden focus-within:border-[var(--border-focus)]">
          <span className="flex items-center px-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] font-[family-name:var(--font-mono)] select-none whitespace-nowrap">
            {homedir || '~'}/
          </span>
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => setInputValue(e.target.value)}
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
