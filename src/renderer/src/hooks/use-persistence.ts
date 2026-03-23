import { useEffect, useRef } from 'react'
import { trpc } from '../lib/trpc'
import { useTilingStore } from '../stores/tiling-store'

export function usePersistence(): { isLoaded: boolean } {
  const initialized = useTilingStore((s) => s.initialized)
  const initialize = useTilingStore((s) => s.initialize)
  const loadQuery = trpc.loadState.useQuery(undefined, { enabled: !initialized })
  const saveMutation = trpc.saveState.useMutation()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize store from persisted state
  useEffect(() => {
    if (initialized) return
    if (loadQuery.isSuccess) {
      initialize(loadQuery.data ?? null)
    } else if (loadQuery.isError) {
      initialize(null)
    }
  }, [initialized, loadQuery.isSuccess, loadQuery.isError, loadQuery.data, initialize])

  // Debounced save on state changes + periodic autosave
  useEffect(() => {
    if (!initialized) return

    const unsubscribe = useTilingStore.subscribe(
      (state) => ({ workspaces: state.workspaces, activeWorkspace: state.activeWorkspace }),
      () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          const state = useTilingStore.getState().getPersistedState()
          saveMutation.mutate(state)
        }, 1000)
      },
      { equalityFn: (a, b) => a === b }
    )

    const interval = setInterval(() => {
      const state = useTilingStore.getState().getPersistedState()
      saveMutation.mutate(state)
    }, 60_000)

    return () => {
      unsubscribe()
      clearInterval(interval)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [initialized, saveMutation])

  return { isLoaded: initialized }
}
