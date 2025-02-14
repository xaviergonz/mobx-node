import { PlainStructure } from "../plainTypes/types"
import { action, createAtom, IAtom, isObservableArray, isObservableObject } from "mobx"
import { isPlainPrimitive } from "../plainTypes/checks"
import { failure } from "../error/failure"
import { getParentPath } from "./tree/getParentPath"
import { assertIsNode, MobxNode } from "./node"

const snapshots = new WeakMap<MobxNode, PlainStructure>()
const snapshotAtoms = new WeakMap<MobxNode, IAtom>()

/**
 * @internal
 */
export const invalidateSnapshotTreeToRoot = action((node: MobxNode): void => {
  assertIsNode(node, "node")

  let current: MobxNode | undefined = node
  while (current) {
    snapshots.delete(current)
    snapshotAtoms.get(current)?.reportChanged()
    current = getParentPath(current)?.parent as MobxNode | undefined
  }
})

const createSnapshot = action(<T extends MobxNode>(node: T): T => {
  assertIsNode(node, "node")

  if (isObservableArray(node)) {
    return node.map((v) => getSnapshotOrPrimitive(v, true)) as T
  }

  if (isObservableObject(node)) {
    const obj = {} as any
    Object.entries(node as any).forEach(([key, v]) => {
      obj[key] = getSnapshotOrPrimitive(v, true)
    })
    return obj
  }

  throw failure(`only observable objects, observable arrays and primitives are supported`)
})

function getSnapshotOrPrimitive<T>(value: T, acceptPrimitives: boolean): T {
  if (acceptPrimitives && isPlainPrimitive(value)) {
    return value
  }

  assertIsNode(value, "value")
  const node = value

  let existingSnapshot = snapshots.get(node)
  if (!existingSnapshot) {
    existingSnapshot = createSnapshot(node)
    snapshots.set(node, existingSnapshot)
  }

  let atom = snapshotAtoms.get(node)
  if (!atom) {
    atom = createAtom("snapshot")
    snapshotAtoms.set(node, atom)
  }
  atom.reportObserved()

  return existingSnapshot as T
}

/**
 * Returns a stable snapshot of a node.
 *
 * This function computes and caches a snapshot of the given node.
 * It preserves referential integrity by reusing snapshots for unchanged sub-parts.
 *
 * If not a node it will throw.
 *
 * @param node - The node to snapshot.
 * @returns A snapshot of the node.
 */
export function getSnapshot<T extends MobxNode>(node: T): T {
  return getSnapshotOrPrimitive(node, false)
}
