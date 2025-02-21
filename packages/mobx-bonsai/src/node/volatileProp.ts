import { action, IObservableValue, observable } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"
import { onChildAttachedTo } from "./tree/onChildAttachedTo"
import { Dispose } from "../utils/disposeOnce"

type VolatileValueAdmin<TValue> = {
  valueBox: IObservableValue<TValue>
  initialValue: TValue
}

type GetOrCreateValueAdmin<TTarget, TValue> = (target: TTarget) => VolatileValueAdmin<TValue>

const globalVolatileValueAdmins = new Set<WeakMap<object, VolatileValueAdmin<unknown>>>()

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
): [
  getter: (target: TTarget) => TValue,
  setter: (target: TTarget, value: TValue) => void,
  reset: (target: TTarget) => void,
] {
  const volatileValueAdmins = new WeakMap<TTarget, VolatileValueAdmin<TValue>>()
  globalVolatileValueAdmins.add(volatileValueAdmins)

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

    action((target: TTarget): void => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = volatileValueAdmins.get(target)
      if (valueAdmin) {
        valueAdmin.valueBox.set(valueAdmin.initialValue)
      }
    }),
  ]
}

/**
 * Resets all volatile props of a given node to their default values.
 *
 * @param node The node whose volatile values should be reset.
 */
export const resetVolatileProps = action((node: object): void => {
  for (const volatileValueAdmins of globalVolatileValueAdmins) {
    const valueAdmin = volatileValueAdmins.get(node)
    if (valueAdmin) {
      valueAdmin.valueBox.set(valueAdmin.initialValue)
    }
  }
})

/**
 * Attaches a cleanup handler that resets volatile properties of child nodes upon detachment from the object.
 * This function should be usually used over your root store.
 *
 * An example of why you might want this:
 * - Say you have a root store that contains a list of items, and each item has an 'isSelected'
 * volatile property.
 * - You remove an item from the list, which has the volatile property 'isSelected' set.
 * - Later, you undo the removal of the item, and the item is inserted back into the list.
 * - Without any cleanup handler, the 'isSelected' property will still be set, and the item will be
 * selected back automatically.
 * - With this cleanup handler, the 'isSelected' property will be reset when the item is removed from the list.
 *
 * @param target Function that returns the root node object to which child nodes are attached.
 * @returns A function that can be called to dispose of the attached cleanup handlers.
 */
export function resetVolatilePropsOnDetachFrom(target: () => object): Dispose {
  const dispose = onChildAttachedTo({
    target,
    childNodeType: undefined,
    onChildAttached: (child) => {
      return () => {
        resetVolatileProps(child)
      }
    },
    deep: true,
    fireForCurrentChildren: true,
  })

  return () => {
    dispose(false)
  }
}
