import { values } from "mobx"
import { isPrimitive } from "../../plainTypes/checks"
import { assertIsNode, isNode } from "../node"
import { computedProp } from "../computedProp"

/**
 * @internal
 */
export function getChildrenNodesWithTargetSet(
  node: object,
  targetSet: Set<object>,
  options?: {
    deep?: boolean
  }
): void {
  assertIsNode(node, "node")

  const deep = options?.deep ?? false
  values(node).forEach((child) => {
    if (!isPrimitive(child) && isNode(child)) {
      targetSet.add(child)

      if (deep) {
        const deepChildren = getComputedDeepChildren(child)
        deepChildren.forEach((deepChild) => targetSet.add(deepChild))
      }
    }
  })
}

const getComputedShallowChildren = computedProp((node: object): ReadonlySet<object> => {
  const children = new Set<object>()
  getChildrenNodesWithTargetSet(node, children, { deep: false })
  return children
})

const getComputedDeepChildren = computedProp((node: object): ReadonlySet<object> => {
  const children = new Set<object>()
  getChildrenNodesWithTargetSet(node, children, { deep: true })
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
  return options?.deep ? getComputedDeepChildren(node) : getComputedShallowChildren(node)
}
