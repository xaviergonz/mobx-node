import { isArray } from "../../plainTypes/checks"
import { assertIsNode } from "../node"

const unresolved = { resolved: false } as const

/**
 * Tries to resolve a path from an object.
 *
 * @template T Returned value type.
 * @param pathRootNode Node that serves as path root.
 * @param path Path as an string or number array.
 * @returns An object with `{ resolved: true, value: T }` or `{ resolved: false }`.
 */
export function resolvePath<T extends object>(
  pathRootNode: object,
  path: readonly (string | number)[] // accepts number paths too just for convenience
):
  | {
      resolved: true
      value: T
    }
  | {
      resolved: false
      value?: undefined
    } {
  assertIsNode(pathRootNode, "pathRootNode")

  let current = pathRootNode

  const len = path.length
  for (let i = 0; i < len; i++) {
    if (current === null || typeof current !== "object") {
      return unresolved
    }

    const p = path[i]

    // check just to avoid mobx warnings about trying to access out of bounds index
    if (isArray(current) && +p >= current.length) {
      return unresolved
    }

    if (!(p in current)) {
      return unresolved
    }

    current = (current as any)[p]
  }

  return { resolved: true, value: current as T }
}
