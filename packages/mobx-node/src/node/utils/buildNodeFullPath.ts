import { getParentPath } from "../path/getParentPath"
import { Node } from "../node"

/**
 * @internal
 */
export function buildNodeFullPath(node: Node | undefined, subPath?: string): string[] {
  const fullPath: string[] = []

  let current: Node | undefined = node
  while (current) {
    const parent = getParentPath(current)
    if (parent) {
      fullPath.push(parent.path)
    }
    current = parent?.parent as Node | undefined
  }
  fullPath.reverse()

  if (subPath) {
    fullPath.push(subPath)
  }

  return fullPath
}
