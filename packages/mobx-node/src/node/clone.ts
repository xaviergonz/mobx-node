import { getSnapshot } from "./snapshot/getSnapshot"
import { node } from "./node"

/**
 * Clones a node.
 *
 * @param nodeToClone Node to clone.
 * @returns The cloned node.
 */
export function clone<T extends object>(nodeToClone: T): T {
  return node(getSnapshot(nodeToClone))
}
