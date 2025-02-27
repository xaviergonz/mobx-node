import fastDeepEqual from "fast-deep-equal/es6"
import { isNode } from "../node/node"
import { isObservable, toJS } from "mobx"
import { getSnapshot } from "../node/snapshot/getSnapshot"
import { getMobxVersion } from "./getMobxVersion"

/**
 * Deeply compares two values.
 *
 * Supported values are:
 * - Primitives
 * - Boxed observables
 * - Objects, observable objects
 * - Arrays, observable arrays
 * - Typed arrays
 * - Maps, observable maps
 * - Sets, observable sets
 * - Tree nodes (optimized by using snapshot comparison internally)
 *
 * Note that in the case of models the result will be false if their model IDs are different.
 *
 * @param a First value to compare.
 * @param b Second value to compare.
 * @returns `true` if they are the equivalent, `false` otherwise.
 */
export function deepEquals(a: any, b: any): boolean {
  // quick check for reference
  if (a === b) {
    return true
  }

  // use snapshots to compare if possible
  // since snapshots use structural sharing it is more likely
  // to speed up comparisons
  if (isNode(a)) {
    a = getSnapshot(a)
  } else if (isObservable(a)) {
    a = toJS(a, toJSOptions)
  }
  if (isNode(b)) {
    b = getSnapshot(b)
  } else if (isObservable(b)) {
    b = toJS(b, toJSOptions)
  }

  return fastDeepEqual(a, b)
}

const toJSOptions =
  getMobxVersion() >= 6
    ? undefined
    : {
        exportMapsAsObjects: false,
        recurseEverything: false,
      }
