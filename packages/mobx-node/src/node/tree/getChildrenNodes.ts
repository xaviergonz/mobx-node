import { values } from "mobx"
import { isPlainPrimitive } from "../../plainTypes/checks"
import { PlainValue } from "../../plainTypes/types"
import { assertIsNode, isNode, Node } from "../node"

export function getChildrenNodesWithTargetSet(
  node: Node,
  targetSet: Set<Node>,
  options?: {
    deep?: boolean
  }
): void {
  assertIsNode(node)

  const deep = options?.deep ?? false

  ;(values(node) as PlainValue[]).forEach((child) => {
    if (!isPlainPrimitive(child) && isNode(child)) {
      targetSet.add(child)
      if (deep) {
        getChildrenNodesWithTargetSet(child, targetSet, options)
      }
    }
  })
}

/**
 * Returns all the children nodes (this is, excluding primitives) of a node.
 *
 * @param node Node to get the list of children from.
 * @param options An optional object with the `deep` option (defaults to false) to true to get
 * the children deeply or false to get them shallowly.
 * @returns A readonly set with the children.
 */
export function getChildrenNodes(
  node: Node,
  options?: {
    deep?: boolean
  }
): ReadonlySet<Node> {
  const children = new Set<Node>()
  getChildrenNodesWithTargetSet(node, children, options)
  return children
}
