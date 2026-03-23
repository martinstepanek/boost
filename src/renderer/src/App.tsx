import { useShallow } from 'zustand/shallow'
import { useTilingStore } from './stores/tiling-store'
import { useKeybindings } from './hooks/use-keybindings'
import { usePersistence } from './hooks/use-persistence'
import TilingContainer from './components/layout/TilingContainer'
import TerminalOverlay from './components/layout/TerminalOverlay'
import WorkspaceBar from './components/workspace/WorkspaceBar'

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
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {workspaceKeys.map((n) => (
        <div
          key={n}
          className="flex-1 flex overflow-hidden"
          style={{ display: n === activeWorkspace ? 'flex' : 'none' }}
        >
          {workspaces[n] ? (
            <TilingContainer node={workspaces[n].layout} isVisible={n === activeWorkspace} />
          ) : null}
        </div>
      ))}
      <TerminalOverlay />
      <WorkspaceBar />
    </div>
  )
}

export default App
