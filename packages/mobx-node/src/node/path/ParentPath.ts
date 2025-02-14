import { PathElement } from "./pathTypes"
import { Node } from "../node"

/**
 * Path from an object to its immediate parent.
 *
 * @typeparam T Parent object type.
 */

export interface ParentPath<T extends Node> {
  /**
   * Parent object.
   */
  readonly parent: T
  /**
   * Property name (if the parent is an object) or index number (if the parent is an array).
   */
  readonly path: PathElement
}
