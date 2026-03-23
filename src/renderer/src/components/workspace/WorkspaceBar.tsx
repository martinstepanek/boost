import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'
import { Button } from '../ui/button'

export default function WorkspaceBar(): React.JSX.Element {
  const activeWorkspace = useTilingStore((s) => s.activeWorkspace)
  const workspaceKeys = useTilingStore(
    useShallow((s) =>
      Object.keys(s.workspaces)
        .map(Number)
        .sort((a, b) => a - b)
    )
  )
  const workspaces = useTilingStore((s) => s.workspaces)
  const switchWorkspace = useTilingStore((s) => s.switchWorkspace)
  const splitDirection = useTilingStore((s) => s.splitDirection)

  return (
    <div
      className="flex items-center shrink-0 gap-1.5"
      style={{
        height: '32px',
        padding: '0 12px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)'
      }}
    >
      {workspaceKeys.map((n) => {
        const isActive = n === activeWorkspace
        const folderName = workspaces[n]?.cwd ? workspaces[n].cwd.split('/').pop() : ''
        return (
          <Button
            key={n}
            variant={isActive ? 'workspaceActive' : 'workspace'}
            size="sm"
            className="rounded-[5px] font-[family-name:var(--font-ui)]"
            onClick={() => switchWorkspace(n)}
          >
            {n}
            {folderName ? ` ${folderName}` : ''}
          </Button>
        )
      })}
      <span className="ml-auto text-[11px] text-[var(--text-secondary)] font-[family-name:var(--font-ui)]">
        {splitDirection === 'horizontal' ? '⬌' : '⬍'}
      </span>
    </div>
  )
}
