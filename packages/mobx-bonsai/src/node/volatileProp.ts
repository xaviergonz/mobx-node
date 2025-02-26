import { action, IObservableValue, observable } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"

type VolatileValueAdmin<TValue> = {
  valueBox: IObservableValue<TValue>
  initialValue: TValue
}

type GetOrCreateValueAdmin<TTarget, TValue> = (target: TTarget) => VolatileValueAdmin<TValue>

/**
 * Represents a volatile property on an object using a tuple of functions.
 *
 * This type defines a readonly tuple with three functions:
 * - A getter that retrieves the current value of the volatile property from the target object.
 * - A setter that updates the volatile property with a new value on the target object.
 * - A reset function that restores the volatile property on the target object to its default state.
 *
 * @template TTarget - The type of the object that holds the volatile property.
 * @template TValue - The type of the volatile property's value.
 */
export type VolatileProp<TTarget extends object, TValue> = readonly [
  getter: (target: TTarget) => TValue,
  setter: (target: TTarget, value: TValue) => void,
  reset: (target: TTarget) => void,
]

/**
 * Creates a volatile property accessor on a target object.
 * The property is considered "volatile" because it does not persist on the object itself and is not part
 * of its persisted data.
 * Note: Volatile props for unique nodes (nodes with a same type and key) will be shared, since they are
 * actually always the same instance.
 *
 * @typeparam TTarget The type of the target object.
 * @typeparam TValue The type of the volatile property's value.
 * @param defaultValueGen A function that returns the default value for the property.
 * @returns A tuple where the first element is the getter function, the second is the setter function and
 * the third is the reset function to set a default value again.
 *
 * @example
 * ```ts
 * const [getVolatile, setVolatile, resetVolatile] = volatileProp(() => 0);
 *
 * const obj = node({});
 *
 * // Initially, the volatile property is 0.
 * console.log(getVolatile(obj)); // outputs 0
 *
 * // Update the volatile property:
 * setVolatile(obj, 42);
 * console.log(getVolatile(obj)); // outputs 42
 *
 * // Reset the volatile property:
 * resetVolatile(obj);
 * console.log(getVolatile(obj)); // outputs 0

 * ```
 */
export function volatileProp<TTarget extends object, TValue>(
  defaultValueGen: () => TValue
): VolatileProp<TTarget, TValue> {
  const volatileValueAdmins = new WeakMap<TTarget, VolatileValueAdmin<TValue>>()

  const getOrCreateValueAdmin: GetOrCreateValueAdmin<TTarget, TValue> = (target) => {
    let valueAdmin = volatileValueAdmins.get(target)

    if (!valueAdmin) {
      const initialValue = defaultValueGen()
      valueAdmin = {
        valueBox: observable.box(initialValue, { deep: false }),
        initialValue,
      }
      // do not report changed, it is an initialization
      volatileValueAdmins.set(target, valueAdmin)
    }

    return valueAdmin
  }

  const vProp: VolatileProp<TTarget, TValue> = [
    (target: TTarget): TValue => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = getOrCreateValueAdmin(target)
      return valueAdmin.valueBox.get()
    },

    action((target: TTarget, value: TValue): void => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = getOrCreateValueAdmin(target)
      valueAdmin.valueBox.set(value)
    }),

    action((target: TTarget): void => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = volatileValueAdmins.get(target)
      if (valueAdmin) {
        valueAdmin.valueBox.set(valueAdmin.initialValue)
      }
    }),
  ] as const

  return vProp
}
