import { useShallow } from 'zustand/shallow'
import { useTilingStore } from './stores/tiling-store'
import { useKeybindings } from './hooks/use-keybindings'
import { usePersistence } from './hooks/use-persistence'
import TilingContainer from './components/layout/TilingContainer'
import PaneOverlay from './components/layout/PaneOverlay'
import WorkspaceBar from './components/workspace/WorkspaceBar'
import WorkspaceSetup from './components/workspace/WorkspaceSetup'
import CommandPalette from './components/CommandPalette'

function App(): React.JSX.Element {
  const { isLoaded } = usePersistence()
  useKeybindings()

  const activeWorkspace = useTilingStore((s) => s.activeWorkspace)
  const workspaceKeys = useTilingStore(
    useShallow((s) =>
      Object.keys(s.workspaces)
        .map(Number)
        .sort((a, b) => a - b)
    )
  )
  const workspaces = useTilingStore((s) => s.workspaces)

  if (!isLoaded) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {workspaceKeys.map((n) => {
        const ws = workspaces[n]
        const isActive = n === activeWorkspace
        return (
          <div
            key={n}
            className="flex-1 flex overflow-hidden"
            style={{ display: isActive ? 'flex' : 'none' }}
          >
            {ws?.layout !== null && ws?.layout !== undefined ? (
              <TilingContainer node={ws.layout} isVisible={isActive} />
            ) : (
              <WorkspaceSetup workspaceNumber={n} />
            )}
          </div>
        )
      })}
      <PaneOverlay />
      <CommandPalette />
      <WorkspaceBar />
    </div>
  )
}

export default App
