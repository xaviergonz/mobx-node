import { Path } from "./pathTypes"
import { Node } from "../node"

/**
 * Result of `findParentPath`.
 */
export interface FoundParentPath<T extends Node> {
  /**
   * Found parent node.
   */
  readonly parent: T

  /**
   * Path from the found parent to the child.
   */
  readonly path: Path
}
