import { assertIsNode } from "../node"
import { FoundParentPath } from "./FoundParentPath"
import { getParentPath } from "./getParentPath"
import { ParentPath } from "./ParentPath"
import { WritablePath } from "./pathTypes"

/**
 * Iterates through all the parents (from the nearest until the root)
 * until one of them matches the given predicate.
 * If the predicate is matched it will return the found node plus the
 * path to get from the parent to the child.
 * If none is found it will return undefined.
 *
 * @template T Parent object type.
 * @param child Target node.
 * @param predicate Function that will be run for every parent of the target node, from immediate parent to the root.
 * @param maxDepth Max depth, or 0 for infinite.
 * @returns The found parent node and the path to get from the parent to the child, or undefined if not found.
 */
export function findParentPath<T extends object>(
  child: object,
  predicate: (parentNode: object) => boolean,
  maxDepth = 0
): FoundParentPath<T> | undefined {
  assertIsNode(child, "child")

  const path: WritablePath = []

  let current: any = child
  let depth = 0

  let parentPath: ParentPath<any> | undefined
  while ((parentPath = getParentPath(current))) {
    path.unshift(parentPath.path)
    current = parentPath.parent
    if (predicate(current)) {
      return {
        parent: current,
        path,
      }
    }

    depth++
    if (maxDepth > 0 && depth === maxDepth) {
      break
    }
  }
  return undefined
}
