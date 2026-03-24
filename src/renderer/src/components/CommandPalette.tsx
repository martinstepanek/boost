import { useEffect, useCallback, useMemo, useState } from 'react'
import { Terminal, Sparkles, GitPullRequestDraft } from 'lucide-react'
import { useTilingStore } from '../stores/tiling-store'
import { APP_REGISTRY, type AppDefinition } from '../../../shared/app-registry'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from './ui/command'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Sparkles,
  GitPullRequestDraft
}

export default function CommandPalette(): React.JSX.Element | null {
  const open = useTilingStore((s) => s.commandPaletteOpen)
  const closeCommandPalette = useTilingStore((s) => s.closeCommandPalette)
  const createPaneForApp = useTilingStore((s) => s.createPaneForApp)
  const cwd = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.cwd ?? '')
  const targetId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.targetId)
  const [disabledApps, setDisabledApps] = useState<Set<string>>(new Set())
  const sortedApps = useMemo(
    () => [...APP_REGISTRY].sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  // Check git availability when palette opens
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function check(): Promise<void> {
      const disabled = new Set<string>()
      try {
        const installed = await window.git.isInstalled(targetId)
        const isRepo = cwd ? await window.git.isRepo(cwd, targetId) : false
        if (!installed || !isRepo) {
          disabled.add('review')
        }
      } catch {
        disabled.add('review')
      }
      if (!cancelled) setDisabledApps(disabled)
    }
    check()
    return () => {
      cancelled = true
    }
  }, [open, cwd, targetId])

  const handleSelect = useCallback(
    (app: AppDefinition) => {
      if (disabledApps.has(app.id)) return
      closeCommandPalette()
      createPaneForApp(app.id)
    },
    [closeCommandPalette, createPaneForApp, disabledApps]
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeCommandPalette()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [open, closeCommandPalette])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette()
      }}
    >
      <div className="w-[480px] overflow-hidden rounded-lg border border-[var(--border)] shadow-2xl">
        <Command>
          <CommandInput placeholder="Type a command..." autoFocus />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {sortedApps.map((app) => {
              const Icon = ICON_MAP[app.icon]
              const isDisabled = disabledApps.has(app.id)
              return (
                <CommandItem
                  key={app.id}
                  value={app.label}
                  onSelect={() => handleSelect(app)}
                  disabled={isDisabled}
                  className={isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                >
                  {Icon && <Icon className="h-4 w-4 text-[var(--text-secondary)]" />}
                  <div>
                    <div className="text-sm">{app.label}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {isDisabled ? 'Not available (not a git repository)' : app.description}
                    </div>
                  </div>
                </CommandItem>
              )
            })}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
