export interface AppDefinition {
  id: string
  label: string
  description: string
  icon: string
  command?: { cmd: string; args: string[] }
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
    command: { cmd: 'claude', args: [] }
  }
]
