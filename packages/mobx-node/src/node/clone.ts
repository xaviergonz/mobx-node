import { getSnapshot } from "./getSnapshot"
import { node, Node } from "./node"

/**
 * Clones a node.
 *
 * @param nodeToClone Node to clone.
 * @returns The cloned node.
 */
export function clone<T extends Node>(nodeToClone: T): T {
  return node(getSnapshot(nodeToClone))
}
