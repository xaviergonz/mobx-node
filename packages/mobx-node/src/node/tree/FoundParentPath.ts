import { Path } from "./pathTypes"
import { MobxNode } from "../node"

/**
 * Result of `findParentPath`.
 */
export interface FoundParentPath<T extends MobxNode> {
  /**
   * Found parent node.
   */
  readonly parent: T

  /**
   * Path from the found parent to the child.
   */
  readonly path: Path
}
