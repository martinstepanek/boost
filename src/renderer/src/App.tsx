import { trpc } from './lib/trpc'

function App(): React.JSX.Element {
  const ping = trpc.ping.useQuery()

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Boost</h1>
        <p className="text-lg text-gray-400">
          tRPC over IPC: <span className="text-green-400">{ping.data ?? 'loading...'}</span>
        </p>
      </div>
    </div>
  )
}

export default App
