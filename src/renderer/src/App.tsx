import { useTilingStore } from './stores/tiling-store'
import { useKeybindings } from './hooks/use-keybindings'
import { usePersistence } from './hooks/use-persistence'
import TilingContainer from './components/layout/TilingContainer'
import WorkspaceBar from './components/workspace/WorkspaceBar'

function App(): React.JSX.Element {
  const { isLoaded } = usePersistence()
  useKeybindings()

  const workspace = useTilingStore((s) => s.workspaces[s.activeWorkspace])

  console.log('App render:', { isLoaded, hasWorkspace: !!workspace })

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex-1 flex overflow-hidden">
        {workspace ? (
          <TilingContainer node={workspace.layout} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">No workspace</div>
        )}
      </div>
      <WorkspaceBar />
    </div>
  )
}

export default App
