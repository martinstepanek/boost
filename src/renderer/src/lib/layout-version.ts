type Listener = () => void

let version = 0
const listeners = new Set<Listener>()

export function bumpLayoutVersion(): void {
  version++
  for (const l of listeners) l()
}

export function getLayoutVersion(): number {
  return version
}

export function subscribeLayoutVersion(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
