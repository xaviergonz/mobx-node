import { isChildOfParent } from "./isChildOfParent"

/**
 * Returns if the target is a "parent" that has in its tree the given "child" node.
 *
 * @param parent Target node.
 * @param child Child node.
 * @returns true if the object is a parent of the child, false otherwise.
 */
export function isParentOfChild(parent: object, child: object): boolean {
  return isChildOfParent(child, parent)
}
