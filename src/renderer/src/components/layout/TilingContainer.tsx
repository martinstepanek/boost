import type { TilingNode } from '../../../../shared/types'
import Pane from './Pane'
import SplitContainer from './SplitContainer'

interface TilingContainerProps {
  node: TilingNode
}

export default function TilingContainer({ node }: TilingContainerProps): React.JSX.Element {
  if (node.type === 'pane') {
    return <Pane pane={node} />
  }
  return <SplitContainer split={node} />
}
