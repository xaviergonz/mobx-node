import { assertIsNode } from "../node"
import { getParentPath } from "./getParentPath"
import { ParentPath } from "./ParentPath"
import { Path, WritablePath } from "./pathTypes"

/**
 * Gets the path to get from a parent to a given child.
 * Returns an empty array if the child is actually the given parent or undefined if the child is not a child of the parent.
 *
 * @param fromParent The parent node.
 * @param toChild The child node.
 * @returns The path from the parent to the child or undefined if the child is not a child of the parent.
 */
export function getParentToChildPath(fromParent: object, toChild: object): Path | undefined {
  assertIsNode(fromParent, "fromParent")
  assertIsNode(toChild, "toChild")

  if (fromParent === toChild) {
    return []
  }

  const path: WritablePath = []

  let current = toChild
  let parentPath: ParentPath<any> | undefined
  while ((parentPath = getParentPath(current))) {
    path.unshift(parentPath.path)

    current = parentPath.parent
    if (current === fromParent) {
      return path
    }
  }
  return undefined
}
