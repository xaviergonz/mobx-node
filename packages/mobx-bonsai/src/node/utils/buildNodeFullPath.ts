import { getParentPath } from "../tree/getParentPath"

export function buildNodeFullPath(node: object | undefined, subPath?: string): string[] {
  const fullPath: string[] = []

  let current: object | undefined = node
  while (current) {
    const parent = getParentPath(current)
    if (parent) {
      fullPath.push(parent.path)
    }
    current = parent?.parent
  }
  fullPath.reverse()

  if (subPath) {
    fullPath.push(subPath)
  }

  return fullPath
}
