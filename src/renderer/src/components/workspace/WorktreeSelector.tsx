import { useState, useEffect } from 'react'
import { Button } from '../ui/button'

interface Worktree {
  path: string
  branch: string
  isMain: boolean
}

interface WorktreeSelectorProps {
  repoPath: string
  targetId: string
  onSelect: (path: string) => void
}

export default function WorktreeSelector({
  repoPath,
  targetId,
  onSelect
}: WorktreeSelectorProps): React.JSX.Element {
  const [worktrees, setWorktrees] = useState<Worktree[]>([])
  const [creating, setCreating] = useState(false)
  const [branchInput, setBranchInput] = useState('')
  const [error, setError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<Worktree | null>(null)

  useEffect(() => {
    let cancelled = false
    window.git.listWorktrees(repoPath, targetId).then((wts) => {
      if (!cancelled) setWorktrees(wts)
    })
    return () => {
      cancelled = true
    }
  }, [repoPath, targetId])

  const handleCreate = async (): Promise<void> => {
    const name = branchInput.trim()
    if (!name) return
    setError('')
    try {
      const result = await window.git.addWorktree(repoPath, name, targetId)
      setCreating(false)
      setBranchInput('')
      onSelect(result.path)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create worktree')
    }
  }

  const handleRemove = async (wt: Worktree): Promise<void> => {
    setError('')
    try {
      await window.git.removeWorktree(repoPath, wt.path, targetId)
      setWorktrees((prev) => prev.filter((w) => w.path !== wt.path))
      setConfirmRemove(null)
    } catch {
      // Likely has uncommitted changes — ask for confirmation
      setConfirmRemove(wt)
    }
  }

  const handleForceRemove = async (): Promise<void> => {
    if (!confirmRemove) return
    setError('')
    try {
      await window.git.removeWorktree(repoPath, confirmRemove.path, targetId, true)
      setWorktrees((prev) => prev.filter((w) => w.path !== confirmRemove.path))
      setConfirmRemove(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove worktree')
      setConfirmRemove(null)
    }
  }

  if (worktrees.length === 0 && !creating) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
          Git repo detected
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(true)}>
          + Worktree
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {worktrees.map((wt) => (
          <div key={wt.path} className="group flex items-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSelect(wt.path)}
              title={wt.path}
            >
              {wt.branch}
              {wt.isMain && ' (main)'}
            </Button>
            {!wt.isMain && (
              <button
                type="button"
                onClick={() => handleRemove(wt)}
                className="ml-0.5 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs px-1 transition-opacity"
                title="Remove worktree"
              >
                x
              </button>
            )}
          </div>
        ))}
        {!creating && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(true)}>
            + New
          </Button>
        )}
      </div>
      {creating && (
        <div className="flex items-center gap-2">
          <input
            value={branchInput}
            onChange={(e) => setBranchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
              if (e.key === 'Escape') {
                setCreating(false)
                setBranchInput('')
                setError('')
              }
            }}
            placeholder="branch-name"
            autoFocus
            spellCheck={false}
            className="w-[200px] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)] font-[family-name:var(--font-mono)] placeholder:text-[var(--text-secondary)] rounded border border-[var(--border)] focus:outline-none focus:border-[var(--border-focus)]"
          />
          <Button type="button" variant="default" size="sm" onClick={handleCreate}>
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCreating(false)
              setBranchInput('')
              setError('')
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      {confirmRemove && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
            Worktree &quot;{confirmRemove.branch}&quot; has uncommitted changes. Delete anyway?
          </span>
          <Button type="button" variant="default" size="sm" onClick={handleForceRemove}>
            Delete
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRemove(null)}>
            Cancel
          </Button>
        </div>
      )}
      {error && (
        <p className="text-[11px] text-[var(--danger)] font-[family-name:var(--font-ui)]">
          {error}
        </p>
      )}
    </div>
  )
}
