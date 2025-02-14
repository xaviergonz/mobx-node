import { getParentPath } from "../tree/getParentPath"
import { MobxNode } from "../node"

/**
 * @internal
 */
export function buildNodeFullPath(node: MobxNode | undefined, subPath?: string): string[] {
  const fullPath: string[] = []

  let current: MobxNode | undefined = node
  while (current) {
    const parent = getParentPath(current)
    if (parent) {
      fullPath.push(parent.path)
    }
    current = parent?.parent as MobxNode | undefined
  }
  fullPath.reverse()

  if (subPath) {
    fullPath.push(subPath)
  }

  return fullPath
}
