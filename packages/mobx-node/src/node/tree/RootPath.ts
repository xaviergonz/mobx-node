import { Path } from "./pathTypes"
import { MobxNode } from "../node"

/**
 * Path from an object to its root.
 *
 * @typeparam T Root object type.
 */

export interface RootPath<T extends MobxNode> {
  /**
   * Root object.
   */
  readonly root: T
  /**
   * Path from the root to the given target, as a string array.
   * If the target is a root itself then the array will be empty.
   */
  readonly path: Path

  /**
   * Objects in the path, from root (included) until target (included).
   * If the target is a root then only the target will be included.
   */
  readonly pathObjects: ReadonlyArray<unknown>
}
