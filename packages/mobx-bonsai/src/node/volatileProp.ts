import { action, IObservableValue, observable } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"

type VolatileValueAdmin<TValue> = {
  valueBox: IObservableValue<TValue>
}

type GetOrCreateValueAdmin<TTarget, TValue> = (target: TTarget) => VolatileValueAdmin<TValue>

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
 * @returns A tuple where the first element is the getter function and the second is the setter function.
 *
 * @example
 * ```ts
 * const [getVolatile, setVolatile] = volatileProp(() => 0);
 * const obj = node({});
 * // Initially, the volatile property is 0.
 * console.log(getVolatile(obj)); // outputs 0
 * // Update the volatile property:
 * setVolatile(obj, 42);
 * console.log(getVolatile(obj)); // outputs 42
 * ```
 */
export function volatileProp<TTarget extends object, TValue>(
  defaultValueGen: () => TValue
): [getter: (target: TTarget) => TValue, setter: (target: TTarget, value: TValue) => void] {
  const volatileValueAdmins = new WeakMap<TTarget, VolatileValueAdmin<TValue>>()

  const getOrCreateValueAdmin: GetOrCreateValueAdmin<TTarget, TValue> = (target) => {
    let valueAdmin = volatileValueAdmins.get(target)

    if (!valueAdmin) {
      valueAdmin = {
        valueBox: observable.box(defaultValueGen(), { deep: false }),
      }
      // do not report changed, it is an initialization
      volatileValueAdmins.set(target, valueAdmin)
    }

    return valueAdmin
  }

  return [
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
  ]
}
