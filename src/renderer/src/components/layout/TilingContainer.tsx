import type { TilingNode } from '../../../../shared/types'
import Pane from './Pane'
import SplitContainer from './SplitContainer'
import TabContainer from './TabContainer'

interface TilingContainerProps {
  node: TilingNode
  isVisible: boolean
}

export default function TilingContainer({
  node,
  isVisible
}: TilingContainerProps): React.JSX.Element {
  if (node.type === 'pane') {
    return <Pane pane={node} isVisible={isVisible} />
  }
  if (node.type === 'tab') {
    return <TabContainer tab={node} isVisible={isVisible} />
  }
  return <SplitContainer split={node} isVisible={isVisible} />
}
