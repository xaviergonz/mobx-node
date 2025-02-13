import { PlainStructure } from "../plainTypes/types"
import { getNodeData, reportNodeParentObserved } from "./node"

/**
 * Returns the root node, this is, will follow the tree up to the node with no parent and will return it.
 *
 * Note that this function will throw if the passed object is not a node.
 */
export function getRootNode<TRoot = unknown>(node: PlainStructure): TRoot {
  const nodeData = getNodeData(node)

  reportNodeParentObserved(node)

  const ret = nodeData.parent ? getRootNode(nodeData.parent.object as any) : node
  reportNodeParentObserved(node)
  return ret as unknown as TRoot
}
