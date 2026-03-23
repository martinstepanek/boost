import { useShallow } from 'zustand/shallow'
import { useTilingStore } from '../../stores/tiling-store'

export default function WorkspaceBar(): React.JSX.Element {
  const activeWorkspace = useTilingStore((s) => s.activeWorkspace)
  const workspaceKeys = useTilingStore(
    useShallow((s) =>
      Object.keys(s.workspaces)
        .map(Number)
        .sort((a, b) => a - b)
    )
  )
  const switchWorkspace = useTilingStore((s) => s.switchWorkspace)
  const splitDirection = useTilingStore((s) => s.splitDirection)

  return (
    <div
      className="flex items-center shrink-0"
      style={{
        height: '32px',
        padding: '0 12px',
        gap: '6px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)'
      }}
    >
      {workspaceKeys.map((n) => (
        <button
          key={n}
          style={{
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            backgroundColor: n === activeWorkspace ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
            color: n === activeWorkspace ? 'var(--accent)' : 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            if (n !== activeWorkspace) {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }
          }}
          onMouseLeave={(e) => {
            if (n !== activeWorkspace) {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }
          }}
          onClick={() => switchWorkspace(n)}
        >
          {n}
        </button>
      ))}
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '11px',
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-secondary)'
        }}
      >
        {splitDirection === 'horizontal' ? '⬌' : '⬍'}
      </span>
    </div>
  )
}
