export interface AppDefinition {
  id: string
  label: string
  description: string
  icon: string
  command?: { cmd: string; args: string[] }
  resolveArgs?: (params: Record<string, unknown>) => string[]
}

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Open a new terminal',
    icon: 'Terminal'
  },
  {
    id: 'claude',
    label: 'Claude Code',
    description: 'Open Claude Code AI assistant',
    icon: 'Sparkles',
    command: { cmd: 'claude', args: [] },
    resolveArgs: (params) => {
      const sessionId = params.sessionId
      return typeof sessionId === 'string' ? ['--resume', sessionId] : []
    }
  }
]

export function getAppDefinition(appId: string): AppDefinition | undefined {
  return APP_REGISTRY.find((a) => a.id === appId)
}
