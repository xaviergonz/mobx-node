import { assertIsNode, MobxNode } from "../node"
import { getParent } from "./getParent"

/**
 * Returns if the target is a "child" of the tree of the given "parent" node.
 *
 * @param child Target node.
 * @param parent Parent node.
 * @returns
 */
export function isChildOfParent(child: MobxNode, parent: MobxNode): boolean {
  assertIsNode(child, "child")
  assertIsNode(parent, "parent")

  let currentParent = getParent<MobxNode>(child)
  while (currentParent) {
    if (currentParent === parent) {
      return true
    }

    currentParent = getParent(currentParent)
  }

  return false
}
