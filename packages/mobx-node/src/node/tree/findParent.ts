import { findParentPath } from "./findParentPath"

/**
 * Iterates through all the parents (from the nearest until the root)
 * until one of them matches the given predicate.
 * If the predicate is matched it will return the found node.
 * If none is found it will return undefined.
 *
 * @typeparam T Parent node type.
 * @param child Target node.
 * @param predicate Function that will be run for every parent of the target node, from immediate parent to the root.
 * @param maxDepth Max depth, or 0 for infinite.
 * @returns
 */
export function findParent<T extends object>(
  child: object,
  predicate: (parentNode: object) => boolean,
  maxDepth = 0
): T | undefined {
  const foundParentPath = findParentPath(child, predicate, maxDepth)
  return foundParentPath ? (foundParentPath.parent as T) : undefined
}
