import { router, publicProcedure } from './trpc'
import { z } from 'zod'
import { loadState, saveState } from '../main/persistence'
import type { PersistedState } from './types'

const persistedStateSchema = z.object({
  version: z.literal(1),
  activeWorkspace: z.number(),
  workspaces: z.record(
    z.string(),
    z.object({
      layout: z.unknown(),
      focusedPaneId: z.string(),
      cwd: z.string(),
      targetId: z.string()
    })
  )
})

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong'),

  loadState: publicProcedure.query(async () => {
    return await loadState()
  }),

  saveState: publicProcedure.input(persistedStateSchema).mutation(async ({ input }) => {
    await saveState(input as PersistedState)
    return { success: true }
  })
})

export type AppRouter = typeof appRouter
