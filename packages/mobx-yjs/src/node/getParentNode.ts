import { PlainStructure } from "../plainTypes/types"
import { getNodeData, reportNodeParentObserved } from "./node"

export type ParentNode<TParent> = { parent: TParent; parentPath: string }

/**
 * If the node has a parent it will return:
 *
 * ```ts
 * {
 *   parent: parentObject,
 *   parentPath: "propertyName",
 * }
 * ```
 *
 * If it has no parent (root node) it will return `undefined`.
 *
 * Note that this function will throw if the passed object is not a node.
 */
export function getParentNode<TParent = unknown>(
  node: PlainStructure
): ParentNode<TParent> | undefined {
  const nodeData = getNodeData(node)

  const ret = nodeData.parent
    ? { parent: nodeData.parent.object as any, parentPath: nodeData.parent.path }
    : undefined

  reportNodeParentObserved(node)

  return ret
}
