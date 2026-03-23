interface SimpleRect {
  x: number
  y: number
  w: number
  h: number
}

type Listener = () => void

class PaneRectStore {
  private rects = new Map<string, SimpleRect>()
  private listeners = new Set<Listener>()
  private snapshot = new Map<string, SimpleRect>()

  set(id: string, rect: SimpleRect): void {
    this.rects.set(id, rect)
  }

  delete(id: string): void {
    this.rects.delete(id)
  }

  notify(): void {
    this.snapshot = new Map(this.rects)
    for (const l of this.listeners) l()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): Map<string, SimpleRect> {
    return this.snapshot
  }
}

export const paneRectStore = new PaneRectStore()
