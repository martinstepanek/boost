import type { TabNode } from '../../../../shared/types'
import { useTilingStore } from '../../stores/tiling-store'
import TilingContainer from './TilingContainer'

interface TabContainerProps {
  tab: TabNode
  isVisible: boolean
}

export default function TabContainer({ tab, isVisible }: TabContainerProps): React.JSX.Element {
  const setFocusedPane = useTilingStore((s) => s.setFocusedPane)
  const focusedPaneId = useTilingStore((s) => s.workspaces[s.activeWorkspace]?.focusedPaneId ?? '')
  const switchActiveTab = useTilingStore((s) => s.switchActiveTab)

  const activeChild = tab.children[tab.activeIndex] ?? tab.children[0]

  return (
    <div className="flex-1 flex flex-col">
      <div
        className="flex shrink-0 overflow-x-auto"
        style={{
          height: '28px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          gap: '1px'
        }}
      >
        {tab.children.map((child, index) => {
          const isActive = index === tab.activeIndex
          const isFocusedTab = child.id === focusedPaneId
          const label = child.app === 'terminal' ? 'Terminal' : child.app

          return (
            <button
              key={child.id}
              onClick={() => {
                switchActiveTab(tab.id, index)
                setFocusedPane(child.id)
              }}
              style={{
                padding: '0 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 100ms ease',
                backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom:
                  isFocusedTab && isActive ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="flex-1 flex overflow-hidden">
        {activeChild && <TilingContainer node={activeChild} isVisible={isVisible} />}
      </div>
    </div>
  )
}
