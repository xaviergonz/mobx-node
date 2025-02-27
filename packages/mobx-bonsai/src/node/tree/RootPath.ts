import { Path } from "./pathTypes"

/**
 * Path from an object to its root.
 *
 * @template T Root object type.
 */
export interface RootPath<T extends object> {
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
