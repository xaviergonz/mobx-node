import { isChildOfParent } from "./isChildOfParent"
import { MobxNode } from "../node"

/**
 * Returns if the target is a "parent" that has in its tree the given "child" node.
 *
 * @param parent Target node.
 * @param child Child node.
 * @returns true if the object is a parent of the child, false otherwise.
 */
export function isParentOfChild(parent: MobxNode, child: MobxNode): boolean {
  return isChildOfParent(child, parent)
}
