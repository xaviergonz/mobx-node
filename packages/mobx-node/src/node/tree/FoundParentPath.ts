import { Path } from "./pathTypes"

/**
 * Result of `findParentPath`.
 */
export interface FoundParentPath<T extends object> {
  /**
   * Found parent node.
   */
  readonly parent: T

  /**
   * Path from the found parent to the child.
   */
  readonly path: Path
}
