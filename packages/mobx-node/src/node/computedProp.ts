import { computed, IComputedValue, IComputedValueOptions } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"

/**
 * Create a computed property on an object that is used as a function
 * that takes the object as an argument and returns the computed value.
 *
 * Example:
 *
 * ```ts
 * const getPointDistance = computedProp<Point>(
 *  ({ x, y }) => Math.sqrt(x ** 2 + y ** 2)
 * )
 *
 * // this will be a computed value
 * getPointDistance(somePoint)
 * ```
 *
 * You can pass as optional second argument the options for the computed value,
 * the same that MobX takes for its computed function.
 *
 * If you ever need to get the actual computed used for the computed property
 * you can access it through the `getComputedFor` property of the returned function.
 */
export function computedProp<T extends object, R>(
  fn: (obj: T) => R,
  options?: IComputedValueOptions<R>
) {
  const computedFns = new WeakMap<T, IComputedValue<R>>()

  const getFn = (obj: T): R => {
    assertIsObservablePlainStructure(obj, "obj")

    let computedFn = computedFns.get(obj)
    if (!computedFn) {
      computedFn = computed(() => fn(obj), options)
      computedFns.set(obj, computedFn)
    }

    return computedFn.get()
  }

  getFn.getComputedFor = (obj: T) => computedFns.get(obj)

  return getFn
}
