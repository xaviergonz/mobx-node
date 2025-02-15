import { action, createAtom, IAtom } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"

/**
 * Creates a volatile property accessor on a target object.
 * The property is considered "volatile" because it does not persist on the object itself and is not part
 * of its persisted data.
 *
 * @typeparam TTarget The type of the target object.
 * @typeparam TValue The type of the volatile property's value.
 * @param defaultValueGen A function that returns the default value for the property.
 * @returns A tuple where the first element is the getter function and the second is the setter function.
 *
 * @example
 * const [getVolatile, setVolatile] = volatileProp(() => 0);
 * const obj = observable({ });
 * // Initially, the volatile property is 0.
 * console.log(getVolatile(obj)); // outputs 0
 * // Update the volatile property:
 * setVolatile(obj, 42);
 * console.log(getVolatile(obj)); // outputs 42
 */
export function volatileProp<TTarget extends object, TValue>(
  defaultValueGen: () => TValue
): [getter: (target: TTarget) => TValue, setter: (target: TTarget, value: TValue) => void] {
  const volatileProps = new WeakMap<TTarget, { value: TValue; atom: IAtom }>()

  function getOrCreateValueAdmin(target: TTarget): { value: TValue; atom: IAtom } {
    let valueAdmin = volatileProps.get(target)

    if (!valueAdmin) {
      valueAdmin = {
        value: defaultValueGen(),
        atom: createAtom("volatileProp"),
      }
      // do not report changed, it is an initialization
      volatileProps.set(target, valueAdmin)
    }

    return valueAdmin
  }

  return [
    (target: TTarget): TValue => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = getOrCreateValueAdmin(target)
      const ret = valueAdmin.value
      valueAdmin.atom.reportObserved()
      return ret
    },

    action((target: TTarget, value: TValue): void => {
      assertIsObservablePlainStructure(target, "target")

      const valueAdmin = getOrCreateValueAdmin(target)
      valueAdmin.value = value
      valueAdmin.atom.reportChanged()
    }),
  ]
}
