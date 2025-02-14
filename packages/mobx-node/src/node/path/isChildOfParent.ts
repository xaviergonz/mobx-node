import { assertIsNode, Node } from "../node"
import { getParent } from "./getParent"

/**
 * Returns if the target is a "child" of the tree of the given "parent" node.
 *
 * @param child Target node.
 * @param parent Parent node.
 * @returns
 */
export function isChildOfParent(child: Node, parent: Node): boolean {
  assertIsNode(child)
  assertIsNode(parent)

  let currentParent = getParent<Node>(child)
  while (currentParent) {
    if (currentParent === parent) {
      return true
    }

    currentParent = getParent(currentParent)
  }

  return false
}
