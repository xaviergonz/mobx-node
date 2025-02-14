import { getSnapshot } from "./getSnapshot"
import { node, MobxNode } from "./node"

/**
 * Clones a node.
 *
 * @param nodeToClone Node to clone.
 * @returns The cloned node.
 */
export function clone<T extends MobxNode>(nodeToClone: T): T {
  return node(getSnapshot(nodeToClone))
}
