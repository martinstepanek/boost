import { useCallback, useRef } from 'react'
import type { SplitNode } from '../../../../shared/types'
import { useTilingStore } from '../../stores/tiling-store'
import TilingContainer from './TilingContainer'

interface SplitContainerProps {
  split: SplitNode
  isVisible: boolean
}

export default function SplitContainer({ split, isVisible }: SplitContainerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeSplit = useTilingStore((s) => s.resizeSplit)

  const isHorizontal = split.direction === 'horizontal'

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()

      const onMouseMove = (moveEvent: MouseEvent): void => {
        let newRatio: number
        if (isHorizontal) {
          newRatio = (moveEvent.clientX - rect.left) / rect.width
        } else {
          newRatio = (moveEvent.clientY - rect.top) / rect.height
        }
        resizeSplit(split.id, newRatio)
      }

      const onMouseUp = (): void => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [split.id, isHorizontal, resizeSplit]
  )

  const firstSize = `${split.ratio * 100}%`
  const secondSize = `${(1 - split.ratio) * 100}%`

  return (
    <div
      ref={containerRef}
      className="flex-1 flex"
      style={{ flexDirection: isHorizontal ? 'row' : 'column' }}
    >
      <div
        className="flex"
        style={{ [isHorizontal ? 'width' : 'height']: firstSize, flexShrink: 0 }}
      >
        <TilingContainer node={split.children[0]} isVisible={isVisible} />
      </div>
      <div
        className="flex-shrink-0 bg-gray-700 hover:bg-blue-500 transition-colors"
        style={{
          width: isHorizontal ? '4px' : '100%',
          height: isHorizontal ? '100%' : '4px',
          cursor: isHorizontal ? 'col-resize' : 'row-resize'
        }}
        onMouseDown={onMouseDown}
      />
      <div
        className="flex"
        style={{ [isHorizontal ? 'width' : 'height']: secondSize, flexShrink: 0 }}
      >
        <TilingContainer node={split.children[1]} isVisible={isVisible} />
      </div>
    </div>
  )
}
