import { getNodeSnapshot } from "./getNodeSnapshot"
import { node, Node } from "./node"

/**
 * Clones a node.
 * @param nodeToClone Node to clone.
 * @returns The cloned node.
 */
export function cloneNode<T extends Node>(nodeToClone: T): T {
  return node(getNodeSnapshot(nodeToClone))
}
