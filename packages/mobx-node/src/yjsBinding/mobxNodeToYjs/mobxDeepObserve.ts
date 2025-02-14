// based on https://github.com/mobxjs/mobx-utils/blob/master/src/deepObserve.ts
// but modified so paths are string[]

import {
  IArrayDidChange,
  IMapDidChange,
  IObjectDidChange,
  action,
  isObservableArray,
  isObservableMap,
  isObservableObject,
  observe,
  values,
} from "mobx"

type IDisposer = () => void

type Entry = {
  dispose: IDisposer
}

function isRecursivelyObservable(thing: unknown): boolean {
  return isObservableObject(thing) || isObservableArray(thing) || isObservableMap(thing)
}

/**
 * @internal
 */
export type IChange = IObjectDidChange | IArrayDidChange | IMapDidChange

/**
 * @internal
 */
export function mobxDeepObserve<T = any>(target: T, onChange: (change: IChange, root: T) => void) {
  const entrySet = new WeakMap<any, Entry>()

  const processChange = action((change: IChange) => {
    switch (change.type) {
      // object, map
      case "add":
        observeRecursively(change.newValue)
        break

      // object, array, map
      case "update": {
        unobserveRecursively(change.oldValue)
        observeRecursively(change.newValue)
        break
      }

      // object
      case "remove":

      // map
      case "delete":
        unobserveRecursively(change.oldValue)
        break

      // array
      case "splice": {
        change.removed.map(unobserveRecursively)
        change.added.forEach((value) => observeRecursively(value))
        break
      }

      default:
        break
    }

    onChange(change, target)
  })

  const observeRecursively = action((thing: any) => {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (!entry) {
        // just got attached to the tree
        const entry: Entry = {
          dispose: observe(thing, processChange),
        }
        entrySet.set(thing, entry)
        values(thing).forEach((value) => observeRecursively(value))
      }
    }
  })

  const unobserveRecursively = action((thing: any) => {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (entry) {
        entrySet.delete(thing)
        entry.dispose()
        values(thing).forEach(unobserveRecursively)
      }
    }
  })

  observeRecursively(target)

  return {
    dispose: () => {
      unobserveRecursively(target)
    },
  }
}
