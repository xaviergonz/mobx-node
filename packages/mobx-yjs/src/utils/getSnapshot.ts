import { PlainStructure } from "../plainTypes/types"
import { createAtom, IAtom, isObservableArray, isObservableObject } from "mobx"
import { isPlainPrimitive } from "../plainTypes/assertions"
import { failure } from "./failure"
import { getParentRef } from "./getParentRef"

const snapshots = new WeakMap<PlainStructure, PlainStructure>()
const snapshotAtoms = new WeakMap<PlainStructure, IAtom>()

function invalidateSnapshot(struct: PlainStructure): void {
  snapshots.delete(struct)
  snapshotAtoms.get(struct)?.reportChanged()
}

export function invalidateSnapshotTreeToRoot(struct: PlainStructure): void {
  let current: PlainStructure | undefined = struct
  while (current) {
    invalidateSnapshot(current)
    current = getParentRef(current)?.parent as PlainStructure | undefined
  }
}

function createStructSnapshot<T extends PlainStructure>(struct: T): T {
  if (isObservableArray(struct)) {
    return struct.map((v) => getSnapshotOrPrimitive(v, true)) as T
  }

  if (isObservableObject(struct)) {
    const obj = {} as any
    Object.entries(struct as any).forEach(([key, v]) => {
      obj[key] = getSnapshotOrPrimitive(v, true)
    })
    return obj
  }

  throw failure(`only observable objects, observable arrays and primitives are supported`)
}

function getSnapshotOrPrimitive<T>(value: T, acceptPrimitives: boolean): T | undefined {
  if (acceptPrimitives && isPlainPrimitive(value)) {
    return value
  }

  const struct = value as PlainStructure

  if (!getParentRef(struct)) {
    // out of the main tree
    return undefined
  }

  let existingSnapshot = snapshots.get(struct)
  if (!existingSnapshot) {
    existingSnapshot = createStructSnapshot(struct)
    snapshots.set(struct, existingSnapshot)
  }

  let atom = snapshotAtoms.get(struct)
  if (!atom) {
    atom = createAtom("snapshot")
    snapshotAtoms.set(struct, atom)
  }
  atom.reportObserved()

  return existingSnapshot as T
}

/**
 * Returns a stable snapshot of an observable structure that is inside the observable data tree.
 *
 * This function computes and caches a snapshot of the given observable structure.
 * It preserves referential integrity by reusing snapshots for unchanged sub-parts.
 * Note: If the structure is not part of the main observable tree (i.e. lacks a parent reference),
 *       the function returns undefined.
 *
 * @param struct - The observable structure to snapshot.
 * @returns A snapshot of the structure, or undefined if it is out of the main tree.
 */
export function getSnapshot<T extends PlainStructure>(struct: T): T | undefined {
  return getSnapshotOrPrimitive(struct, false)
}
