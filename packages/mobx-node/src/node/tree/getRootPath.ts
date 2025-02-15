import { assertIsNode } from "../node"
import { getParentPath } from "./getParentPath"
import { ParentPath } from "./ParentPath"
import { WritablePath } from "./pathTypes"
import { RootPath } from "./RootPath"

/**
 * Returns the root of the target plus the path from the root to get to the target.
 *
 * Note that this function will throw if the passed object is not a node.
 *
 * @typeparam T Root object type.
 * @param value Target object.
 * @returns
 */
export function getRootPath<T extends object>(node: object): RootPath<T> {
  assertIsNode(node, "node")

  let root = node
  const path = [] as WritablePath
  const pathObjects = [node] as unknown[]

  let parentPath: ParentPath<object> | undefined
  while ((parentPath = getParentPath(root))) {
    root = parentPath.parent
    path.unshift(parentPath.path)
    pathObjects.unshift(parentPath.parent)
  }

  const rootPath: RootPath<any> = { root, path, pathObjects }
  return rootPath
}
