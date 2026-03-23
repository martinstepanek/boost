import type { TilingNode } from '../../../../shared/types'
import Pane from './Pane'
import SplitContainer from './SplitContainer'

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
  return <SplitContainer split={node} isVisible={isVisible} />
}
