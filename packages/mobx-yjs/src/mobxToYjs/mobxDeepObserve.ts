// based on https://github.com/mobxjs/mobx-utils/blob/master/src/deepObserve.ts
// but modified so paths are string[]

import {
  IArrayDidChange,
  IAtom,
  IMapDidChange,
  IObjectDidChange,
  createAtom,
  entries,
  isObservableArray,
  isObservableMap,
  isObservableObject,
  observe,
  values,
} from "mobx"
import { failure } from "../utils/failure"

type IDisposer = () => void

type EntryParent = {
  entry: Entry
  object: unknown
  path: string
}

type Entry = {
  parent: EntryParent | undefined
  dispose: IDisposer
}

export type FullPath = string[]

function buildFullPath(entry: Entry | undefined, subPath?: string): FullPath {
  const fullPath: string[] = []
  while (entry?.parent) {
    fullPath.push(entry.parent.path)
    entry = entry.parent.entry
  }
  fullPath.reverse()

  if (subPath) {
    fullPath.push(subPath)
  }

  return fullPath
}

function isRecursivelyObservable(thing: unknown): boolean {
  return isObservableObject(thing) || isObservableArray(thing) || isObservableMap(thing)
}

export type IChange = IObjectDidChange | IArrayDidChange | IMapDidChange

export function mobxDeepObserve<T = any>(
  target: T,
  onChange: (change: IChange, path: FullPath, root: T) => void
) {
  const entrySet = new WeakMap<any, Entry>()
  const parentAtoms = new WeakMap<any, IAtom>()

  const getParentAtom = (thing: any) => {
    return parentAtoms.get(thing)
  }

  const getOrCreateParentAtom = (thing: any) => {
    let atom = parentAtoms.get(thing)
    if (!atom) {
      atom = createAtom("parent")
      parentAtoms.set(thing, atom)
    }
    return atom
  }

  function emitChange(change: IChange) {
    const entry = entrySet.get(change.object)!
    processChange(change, entry)
    onChange(change, buildFullPath(entry), target)
  }

  function processChange(change: IChange, parentEntry: Entry) {
    const changeTarget = change.object

    switch (change.type) {
      // object, map
      case "add":
        observeRecursively(change.newValue, {
          entry: parentEntry,
          object: changeTarget,
          path: change.name,
        })
        break

      // object, array, map
      case "update": {
        unobserveRecursively(change.oldValue)
        observeRecursively(change.newValue, {
          entry: parentEntry,
          object: changeTarget,
          path: (change as IMapDidChange).name || "" + (change as IArrayDidChange).index,
        })
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
        change.added.forEach((value, idx) =>
          observeRecursively(value, {
            entry: parentEntry,
            object: changeTarget,
            path: "" + (change.index + idx),
          })
        )
        // update paths
        for (let i = change.index + change.addedCount; i < change.object.length; i++) {
          const value = change.object[i]
          if (isRecursivelyObservable(value)) {
            const entry = entrySet.get(value)
            if (entry?.parent) {
              entry.parent.path = "" + i
              getParentAtom(value)?.reportChanged()
            }
          }
        }
        break
      }

      default:
        break
    }
  }

  function observeRecursively(thing: any, entryParent: EntryParent | undefined) {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (entry) {
        // already attached to the tree
        if (
          entry.parent?.entry !== entryParent?.entry ||
          entry.parent?.path !== entryParent?.path
        ) {
          // MWE: this constraint is artificial, and this tool could be made to work with cycles,
          // but it increases administration complexity, has tricky edge cases and the meaning of 'path'
          // would become less clear. So doesn't seem to be needed for now
          throw failure(
            `The same observable object cannot appear twice in the same tree,` +
              ` trying to assign it to ${JSON.stringify(buildFullPath(entryParent?.entry, entryParent?.path))},` +
              ` but it already exists at ${JSON.stringify(buildFullPath(entry.parent?.entry, entry.parent?.path))}.` +
              ` If you are moving the node then remove it from the tree first before moving it.` +
              ` If you are copying the node then use toJS to make a clone first.`
          )
        }
      } else {
        // just got attached to the tree
        const entry: Entry = {
          parent: entryParent,
          dispose: observe(thing, emitChange),
        }
        entrySet.set(thing, entry)
        entries(thing).forEach(([key, value]) =>
          observeRecursively(value, { entry, object: thing, path: key })
        )
        getParentAtom(thing)?.reportChanged() // now part of the tree
      }
    }
  }

  function unobserveRecursively(thing: any) {
    if (isRecursivelyObservable(thing)) {
      const entry = entrySet.get(thing)
      if (entry) {
        entrySet.delete(thing)
        entry.dispose()
        values(thing).forEach(unobserveRecursively)
        getParentAtom(thing)?.reportChanged() // no longer part of the tree
      }
    }
  }

  observeRecursively(target, undefined /* no parent */)

  return {
    dispose: () => {
      unobserveRecursively(target)
    },

    getParentNode(thing: any) {
      getOrCreateParentAtom(thing).reportObserved()
      const entry = entrySet.get(thing)
      if (!entry?.parent) {
        return undefined
      }
      return {
        parent: entry.parent.object,
        parentPath: entry.parent.path,
      }
    },
  }
}
