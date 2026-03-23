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

  return (
    <div className="flex h-7 bg-gray-800 border-t border-gray-700 items-center px-2 gap-1 shrink-0">
      {workspaceKeys.map((n) => (
        <button
          key={n}
          className={`px-3 py-0.5 text-xs font-mono rounded transition-colors ${
            n === activeWorkspace
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
          }`}
          onClick={() => switchWorkspace(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
