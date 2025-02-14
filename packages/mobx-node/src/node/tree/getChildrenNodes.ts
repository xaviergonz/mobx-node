import { values } from "mobx"
import { isPlainPrimitive } from "../../plainTypes/checks"
import { PlainValue } from "../../plainTypes/types"
import { assertIsNode, isNode, MobxNode } from "../node"
import { computedProp } from "../computedProp"

export function getChildrenNodesWithTargetSet(
  node: MobxNode,
  targetSet: Set<MobxNode>,
  options?: {
    deep?: boolean
  }
): void {
  assertIsNode(node, "node")

  const deep = options?.deep ?? false
  ;(values(node) as PlainValue[]).forEach((child) => {
    if (!isPlainPrimitive(child) && isNode(child)) {
      targetSet.add(child)

      if (deep) {
        const deepChildren = getComputedDeepChildren(child)
        deepChildren.forEach((deepChild) => targetSet.add(deepChild))
      }
    }
  })
}

const getComputedShallowChildren = computedProp((node: MobxNode): ReadonlySet<MobxNode> => {
  const children = new Set<MobxNode>()
  getChildrenNodesWithTargetSet(node, children, { deep: false })
  return children
})

const getComputedDeepChildren = computedProp((node: MobxNode): ReadonlySet<MobxNode> => {
  const children = new Set<MobxNode>()
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
  node: MobxNode,
  options?: {
    deep?: boolean
  }
): ReadonlySet<MobxNode> {
  return options?.deep ? getComputedDeepChildren(node) : getComputedShallowChildren(node)
}
