import { useEffect, useCallback } from 'react'
import { Terminal, Sparkles } from 'lucide-react'
import { useTilingStore } from '../stores/tiling-store'
import { APP_REGISTRY, type AppDefinition } from '../../../shared/app-registry'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from './ui/command'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Sparkles
}

export default function CommandPalette(): React.JSX.Element | null {
  const open = useTilingStore((s) => s.commandPaletteOpen)
  const closeCommandPalette = useTilingStore((s) => s.closeCommandPalette)
  const splitFocusedPane = useTilingStore((s) => s.splitFocusedPane)
  const createPaneForApp = useTilingStore((s) => s.createPaneForApp)

  const handleSelect = useCallback(
    (app: AppDefinition) => {
      closeCommandPalette()
      if (app.command) {
        createPaneForApp(app.id)
      } else {
        splitFocusedPane()
      }
    },
    [closeCommandPalette, splitFocusedPane, createPaneForApp]
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
            {APP_REGISTRY.map((app) => {
              const Icon = ICON_MAP[app.icon]
              return (
                <CommandItem key={app.id} value={app.label} onSelect={() => handleSelect(app)}>
                  {Icon && <Icon className="h-4 w-4 text-[var(--text-secondary)]" />}
                  <div>
                    <div className="text-sm">{app.label}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{app.description}</div>
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
