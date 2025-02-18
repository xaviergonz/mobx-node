import { action, IObservableValue, observable } from "mobx"
import { assertIsObservablePlainStructure } from "../plainTypes/checks"
import { failure } from "../error/failure"

type VolatileValueAdmin<TValue> = {
  valueBox: IObservableValue<TValue>
}

type GetOrCreateValueAdmin<TTarget, TValue> = (target: TTarget) => VolatileValueAdmin<TValue>

function unkeyedVolatileProp<TTarget extends object, TValue>(
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

  return createPropertyAccessor<TTarget, TValue>(getOrCreateValueAdmin)
}

export function keyedVolatileProp<TTarget extends object, TValue>(
  defaultValueGen: () => TValue,
  getKey: (target: TTarget) => any
): [getter: (target: TTarget) => TValue, setter: (target: TTarget, value: TValue) => void] {
  type VolatileValueAdminWithInstancesAlive = VolatileValueAdmin<TValue> & {
    readonly instancesAlive: Set<WeakRef<TTarget>>
  }

  const volatileValueAdmins = new Map<any, VolatileValueAdminWithInstancesAlive>()

  const finalizationRegistry = new FinalizationRegistry((key: any) => {
    const valueAdmin = volatileValueAdmins.get(key)
    if (valueAdmin) {
      // remove dead instances
      valueAdmin.instancesAlive.forEach((ref) => {
        if (!ref.deref()) {
          valueAdmin.instancesAlive.delete(ref)
        }
      })
      if (valueAdmin.instancesAlive.size === 0) {
        volatileValueAdmins.delete(key)
      }
    }
  })

  const getOrCreateValueAdmin: GetOrCreateValueAdmin<TTarget, TValue> = (target) => {
    const key = getKey(target)
    if (key === target) {
      throw failure("getKey must not return the same object that was passed as target")
    }

    let valueAdmin = volatileValueAdmins.get(key)

    if (!valueAdmin) {
      valueAdmin = {
        valueBox: observable.box(defaultValueGen(), { deep: false }),
        instancesAlive: new Set(),
      }

      // do not report changed, it is an initialization
      volatileValueAdmins.set(key, valueAdmin)
    }

    let instanceFound = false
    for (const ref of valueAdmin.instancesAlive) {
      if (ref.deref() === target) {
        instanceFound = true
        break
      }
    }

    if (!instanceFound) {
      valueAdmin.instancesAlive.add(new WeakRef(target))
      finalizationRegistry.register(target, key)
    }

    return valueAdmin
  }

  return createPropertyAccessor<TTarget, TValue>(getOrCreateValueAdmin)
}

function createPropertyAccessor<TTarget extends object, TValue>(
  getOrCreateValueAdmin: GetOrCreateValueAdmin<TTarget, TValue>
): [getter: (target: TTarget) => TValue, setter: (target: TTarget, value: TValue) => void] {
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

/**
 * Creates a volatile property accessor on a target object.
 * The property is considered "volatile" because it does not persist on the object itself and is not part
 * of its persisted data.
 *
 * @typeparam TTarget The type of the target object.
 * @typeparam TValue The type of the volatile property's value.
 * @param defaultValueGen A function that returns the default value for the property.
 * @param getKey A function get get a unique key associated to a node (e.g. an ID).
 *   - If a function is passed (recommended whenever possible) then the volatile property is keyed, which means
 *   the volatile property value is shared across all objects that resolve to the same key **as long as one with that
 *   key is kept alive**. This is specially useful to keep an state when the data for example gets moved around in the tree due to bindings,
 *   in which case the node itself is not reused.
 *   - If `undefined` is passed the the volatile property is unkeyed, which means it is unique to the node instance
 *   that gets passed to the getter and setter.
 * @returns A tuple where the first element is the getter function and the second is the setter function.
 *
 * @example
 * const [getVolatile, setVolatile] = volatileProp(() => 0, undefined);
 * const obj = observable({ });
 * // Initially, the volatile property is 0.
 * console.log(getVolatile(obj)); // outputs 0
 * // Update the volatile property:
 * setVolatile(obj, 42);
 * console.log(getVolatile(obj)); // outputs 42
 */
export function volatileProp<TTarget extends object, TValue>(
  defaultValueGen: () => TValue,
  getKey: ((target: TTarget) => any) | undefined
): [getter: (target: TTarget) => TValue, setter: (target: TTarget, value: TValue) => void] {
  return getKey ? keyedVolatileProp(defaultValueGen, getKey) : unkeyedVolatileProp(defaultValueGen)
}
