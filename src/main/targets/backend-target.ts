export interface SpawnConfig {
  command: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
}

export interface TargetInfo {
  id: string
  label: string
}

export interface BackendTarget {
  id: string
  label: string
  spawn(command: string, args: string[], cwd: string): SpawnConfig
  getHomedir(): Promise<string>
  listDir(path: string): Promise<string[]>
}
