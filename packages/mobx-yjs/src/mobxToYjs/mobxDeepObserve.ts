// based on https://github.com/mobxjs/mobx-utils/blob/master/src/deepObserve.ts
// but modified so paths are string[]

import {
  IArrayDidChange,
  IMapDidChange,
  IObjectDidChange,
  entries,
  isObservableArray,
  isObservableMap,
  isObservableObject,
  observe,
  values,
} from "mobx"

type IDisposer = () => void
export type IChange = IObjectDidChange | IArrayDidChange | IMapDidChange
type ParentPath = string | undefined
export type FullPath = string[]

type Entry = {
  dispose: IDisposer
  path: ParentPath
  parent: Entry | undefined
}

function buildPath(entry: Entry | undefined): FullPath {
  if (!entry) {
    return []
  }
  const fullPath: FullPath = []
  while (entry.parent) {
    if (entry.path !== undefined) {
      fullPath.push(entry.path)
    }
    entry = entry.parent
  }
  return fullPath.reverse()
}

function isRecursivelyObservable(thing: unknown): boolean {
  return isObservableObject(thing) || isObservableArray(thing) || isObservableMap(thing)
}

/**
 * Given an object, deeply observes the given object.
 * It is like `observe` from mobx, but applied recursively, including all future children.
 *
 * Note that the given object cannot ever contain cycles and should be a tree.
 *
 * As benefit: path and root will be provided in the callback, so the signature of the listener is
 * (change, path, root) => void
 *
 * The returned disposer can be invoked to clean up the listener
 *
 * deepObserve cannot be used on computed values.
 *
 * @example
 * const disposer = deepObserve(target, (change, path) => {
 *    console.dir(change)
 * })
 */
export function mobxDeepObserve<T = any>(
  target: T,
  listener: (change: IChange, path: FullPath, root: T) => void
): IDisposer {
  const entrySet = new WeakMap<any, Entry>()

  function genericListener(change: IChange) {
    const entry = entrySet.get(change.object)!
    processChange(change, entry)
    listener(change, buildPath(entry), target)
  }

  function processChange(change: IChange, parent: Entry) {
    switch (change.type) {
      // Object changes
      case "add": // also for map
        observeRecursively(change.newValue, parent, change.name)
        break
      case "update": {
        // also for array and map
        unobserveRecursively(change.oldValue)
        observeRecursively(
          change.newValue,
          parent,
          (change as IMapDidChange).name || "" + (change as IArrayDidChange).index
        )
        break
      }
      case "remove": // object
      case "delete": // map
        unobserveRecursively(change.oldValue)
        break
      // Array changes
      case "splice": {
        change.removed.map(unobserveRecursively)
        change.added.forEach((value, idx) =>
          observeRecursively(value, parent, "" + (change.index + idx))
        )
        // update paths
        for (let i = change.index + change.addedCount; i < change.object.length; i++) {
          if (isRecursivelyObservable(change.object[i])) {
            const entry = entrySet.get(change.object[i])
            if (entry) {
              entry.path = "" + i
            }
          }
        }
        break
      }
      default:
        break
    }
  }

  function observeRecursively(thing: any, parent: Entry | undefined, path: ParentPath) {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (entry) {
        if (entry.parent !== parent || entry.path !== path) {
          // MWE: this constraint is artificial, and this tool could be made to work with cycles,
          // but it increases administration complexity, has tricky edge cases and the meaning of 'path'
          // would become less clear. So doesn't seem to be needed for now
          throw new Error(
            `The same observable object cannot appear twice in the same tree,` +
              ` trying to assign it to '${buildPath(parent)}/${path}',` +
              ` but it already exists at '${buildPath(entry.parent)}/${entry.path}'`
          )
        }
      } else {
        const entry = {
          parent,
          path,
          dispose: observe(thing, genericListener),
        }
        entrySet.set(thing, entry)
        entries(thing).forEach(([key, value]) => observeRecursively(value, entry, key))
      }
    }
  }

  function unobserveRecursively(thing: any) {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (!entry) {
        return
      }
      entrySet.delete(thing)
      entry.dispose()
      values(thing).forEach(unobserveRecursively)
    }
  }

  observeRecursively(target, undefined, undefined)

  return () => {
    unobserveRecursively(target)
  }
}
