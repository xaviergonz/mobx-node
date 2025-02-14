import { Node, getNodeData, reportNodeParentObserved } from "../node"
import { ParentPath } from "./ParentPath"

/**
 * If the node has a parent it will return:
 *
 * ```ts
 * {
 *   parent: parentObject,
 *   path: "propertyName",
 * }
 * ```
 *
 * If it has no parent (root node) it will return `undefined`.
 *
 * Note that this function will throw if the passed object is not a node.
 *
 * @typeparam TParent Parent object type.
 * @param node Node to get the parent path from.
 * @returns Parent path or undefined if there's no parent.
 */
export function getParentPath<TParent extends Node>(node: Node): ParentPath<TParent> | undefined {
  const nodeData = getNodeData(node)

  const ret = nodeData.parent
    ? { parent: nodeData.parent.object as any, path: nodeData.parent.path }
    : undefined

  reportNodeParentObserved(node)

  return ret
}
