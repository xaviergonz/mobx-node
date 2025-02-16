import { computedProp } from "../computedProp"
import { assertIsNode, getNodeData } from "../node"

/**
 * @internal
 */
export function getChildrenNodesWithTargetSet(node: object, targetSet: Set<object>): void {
  getShallowChildren(node).forEach((child) => {
    targetSet.add(child)

    const deepChildren = getComputedDeepChildren(child)
    deepChildren.forEach((deepChild) => targetSet.add(deepChild))
  })
}

const getShallowChildren = (node: object): ReadonlySet<object> => getNodeData(node).childrenObjects

const getComputedDeepChildren = computedProp((node: object): ReadonlySet<object> => {
  const children = new Set<object>()
  getChildrenNodesWithTargetSet(node, children)
  return children
})

/**
 * Returns all the children nodes (this is, excluding primitives) of a node.
 *
 * @param node Node to get the list of children from.
 * @param options An optional object with the `deep` option (defaults to false) to true to get
 * the children deeply or false to get them shallowly.
 * @returns A readonly set with the children.
 */
export function getChildrenNodes(
  node: object,
  options?: {
    deep?: boolean
  }
): ReadonlySet<object> {
  assertIsNode(node, "node")

  const deep = options?.deep ?? false
  if (!deep) {
    return getShallowChildren(node)
  }

  return getComputedDeepChildren(node)
}
