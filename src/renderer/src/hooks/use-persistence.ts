import { useEffect, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import { trpc } from '../lib/trpc'
import { useTilingStore } from '../stores/tiling-store'
import { SAVE_DEBOUNCE_MS, AUTOSAVE_INTERVAL_MS } from '../../../shared/constants'

export function usePersistence(): { isLoaded: boolean } {
  const initialized = useTilingStore((s) => s.initialized)
  const initialize = useTilingStore((s) => s.initialize)
  const loadQuery = trpc.loadState.useQuery(undefined, { enabled: !initialized })
  const saveMutation = trpc.saveState.useMutation()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveMutationRef = useRef(saveMutation)

  useEffect(() => {
    saveMutationRef.current = saveMutation
  }, [saveMutation])

  useEffect(() => {
    if (initialized) return
    if (loadQuery.isSuccess) {
      initialize(loadQuery.data ?? null)
    } else if (loadQuery.isError) {
      initialize(null)
    }
  }, [initialized, loadQuery.isSuccess, loadQuery.isError, loadQuery.data, initialize])

  useEffect(() => {
    if (!initialized) return

    const unsubscribe = useTilingStore.subscribe(
      (state) => ({ workspaces: state.workspaces, activeWorkspace: state.activeWorkspace }),
      () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
          const state = useTilingStore.getState().getPersistedState()
          saveMutationRef.current.mutate(state)
        }, SAVE_DEBOUNCE_MS)
      },
      { equalityFn: shallow }
    )

    const interval = setInterval(() => {
      const state = useTilingStore.getState().getPersistedState()
      saveMutationRef.current.mutate(state)
    }, AUTOSAVE_INTERVAL_MS)

    return () => {
      unsubscribe()
      clearInterval(interval)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [initialized])

  return { isLoaded: initialized }
}
