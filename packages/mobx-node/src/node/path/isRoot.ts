import { Node } from "../node"
import { getParent } from "./getParent"

/**
 * Returns if a given node is a root object.
 *
 * Note that this function will throw if the passed object is not a node.
 *
 * @param node Target object.
 * @returns true if the object is a root, false otherwise.
 */

export function isRoot(node: Node): boolean {
  return !getParent(node)
}
