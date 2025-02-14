import { Node } from "../node"
import { getRootPath } from "./getRootPath"

/**
 * Returns the root node, this is, will follow the tree up to the node with no parent and will return it.
 *
 * Note that this function will throw if the passed object is not a node.
 *
 * @typeparam TRoot Root object type.
 * @param node Node to get the root from.
 * @returns Root object.
 */
export function getRoot<TRoot extends Node>(node: Node): TRoot {
  return getRootPath(node).root as TRoot
}
