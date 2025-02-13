import { isObservableArray, isObservableObject } from "mobx"
import { PlainObject } from "../plainTypes/types"
import { failure } from "../error/failure"
import { assertIsNode, Node } from "./node"

/**
 * Resolves a path of keys into a node.
 *
 * @param node Node to start resolving from.
 * @param path Path of keys to resolve.
 * @returns Node at the end of the path.
 */
export function resolveNodePath<T = unknown>(node: Node, path: readonly (string | number)[]): T {
  let target = node
  assertIsNode(target)

  path.forEach((pathSegment) => {
    if (isObservableArray(target)) {
      target = target[+pathSegment]
      assertIsNode(target)
    } else if (isObservableObject(target)) {
      target = (target as PlainObject)[pathSegment] as Node
      assertIsNode(target)
    } else {
      throw failure("unsupported mobx data structure")
    }
  })

  return target as T
}
