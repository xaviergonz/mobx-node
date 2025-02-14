import {
  IArrayDidChange,
  IAtom,
  IObjectDidChange,
  createAtom,
  observable,
  observe,
  set,
} from "mobx"
import { isObservablePlainStructure, isPlainPrimitive } from "../plainTypes/checks"
import { PlainStructure } from "../plainTypes/types"
import { failure } from "../error/failure"
import { invalidateSnapshotTreeToRoot } from "./getSnapshot"
import { buildNodeFullPath } from "./utils/buildNodeFullPath"
import { getParent } from "./tree/getParent"

type ParentNode = {
  object: unknown
  path: string
}

export type MobxNodeChange = IObjectDidChange | IArrayDidChange

export type MobxNodeChangeListener = (change: MobxNodeChange) => void

type MobxNodeData = {
  parent: ParentNode | undefined
  parentAtom: IAtom | undefined
  onChangeListeners: MobxNodeChangeListener[]
}

export type MobxNode = PlainStructure

/**
 * @internal
 */
export function getNodeData(node: MobxNode): MobxNodeData {
  assertIsNode(node, "node")
  return nodes.get(node)!
}

/**
 * @internal
 */
export function reportNodeParentObserved(node: MobxNode): void {
  const data = getNodeData(node)
  if (!data.parentAtom) {
    data.parentAtom = createAtom("parent")
  }
  data.parentAtom.reportObserved()
}

const nodes = new WeakMap<MobxNode, MobxNodeData>()

function mergeNodeData(node: MobxNode, newData: Partial<MobxNodeData>): void {
  const nodeData = getNodeData(node)
  Object.assign(nodeData, newData)

  if ("parent" in newData) {
    nodeData.parentAtom?.reportChanged()
  }
}

export function isNode(struct: unknown): struct is PlainStructure {
  return nodes.has(struct as PlainStructure)
}

export function assertIsNode(node: unknown, argName: string): asserts node is MobxNode {
  if (!isNode(node)) {
    throw failure(`${argName} must be a mobx-node node`)
  }
}

function emitChange(eventTarget: MobxNode, change: IObjectDidChange | IArrayDidChange) {
  const changeListeners = getNodeData(eventTarget).onChangeListeners
  if (changeListeners.length > 0) {
    changeListeners.forEach((listener) => {
      listener(change)
    })
  }
}

function emitChangeToRoot(eventTarget: MobxNode, change: IObjectDidChange | IArrayDidChange) {
  let currentTarget: MobxNode | undefined = eventTarget
  while (currentTarget) {
    emitChange(currentTarget, change)
    currentTarget = getParent(currentTarget)
  }
}

/**
 * Registers a change listener on the provided node.
 *
 * The listener is invoked whenever the node undergoes a change, such as additions,
 * updates, or removals within its observable structure. This includes receiving
 * events from both object and array mutations.
 *
 * @param node - The node to attach the change listener to.
 * @param listener - The callback function that is called when a change occurs.
 *   The listener receives two parameters:
 *   - changeTarget: The node where the change occurred.
 *   - change: The change event, which is either a MobxNodeChange.
 *
 * @returns A disposer function that, when invoked, unregisters the listener.
 */
export function addNodeChangeListener(node: MobxNode, listener: MobxNodeChangeListener) {
  const changeListeners = getNodeData(node).onChangeListeners
  changeListeners.push(listener)

  return () => {
    const index = changeListeners.indexOf(listener)
    if (index !== -1) {
      changeListeners.splice(index, 1)
    }
  }
}

export function node<T extends PlainStructure>(struct: T): T {
  if (isNode(struct)) {
    // nothing to do
    return struct
  }

  const observableStruct = (() => {
    if (isObservablePlainStructure(struct)) {
      return struct
    }

    return Array.isArray(struct)
      ? observable.array(struct, { deep: true })
      : observable.object(struct, undefined, { deep: true })
  })()

  const nodeData: MobxNodeData = {
    parent: undefined,
    parentAtom: undefined,
    onChangeListeners: [],
  }

  nodes.set(observableStruct, nodeData)

  const attachAsChildNode = (v: any, path: string, set?: (n: PlainStructure) => void) => {
    if (isPlainPrimitive(v)) {
      return
    }

    let n = v
    if (isNode(n)) {
      // ensure it is detached first or at same position
      const parent = getNodeData(n).parent
      if (parent && (parent.object !== observableStruct || parent.path !== path)) {
        throw failure(
          `The same node cannot appear twice in the same or different trees,` +
            ` trying to assign it to ${JSON.stringify(buildNodeFullPath(observableStruct, path))},` +
            ` but it already exists at ${JSON.stringify(buildNodeFullPath(parent.object as MobxNode | undefined, parent.path))}.` +
            ` If you are moving the node then remove it from the tree first before moving it.` +
            ` If you are copying the node then use 'cloneNode' to make a clone first.`
        )
      }
    } else {
      n = node(v)
      if (n !== v) {
        // actually needed conversion
        if (set) {
          set(n)
        } else {
          throw failure(
            "assertion error: the value needed to be converted to a node but set was not provided"
          )
        }
      }
    }

    mergeNodeData(n, {
      parent: { object: observableStruct, path },
    })
  }

  const detachAsChildNode = (v: any) => {
    if (isPlainPrimitive(v)) {
      return
    }

    if (!isNode(v)) {
      throw failure("node expected")
    }

    mergeNodeData(v, {
      parent: undefined,
    })
  }

  // make current children nodes too (init)
  if (Array.isArray(observableStruct)) {
    const array = observableStruct
    array.forEach((v, i) => {
      attachAsChildNode(v, i.toString(), (n) => {
        set(array, i, n)
      })
    })
  } else {
    const object = observableStruct as any
    Object.entries(object).forEach(([key, v]) => {
      attachAsChildNode(v, key, (n) => {
        set(object, key, n)
      })
    })
  }

  // and observe changes
  if (Array.isArray(observableStruct)) {
    observe(observableStruct, (change) => {
      switch (change.type) {
        case "update": {
          detachAsChildNode(change.oldValue)
          attachAsChildNode(change.newValue, "" + change.index)
          break
        }

        case "splice": {
          change.removed.map((v) => detachAsChildNode(v))
          change.added.forEach((value, idx) => {
            attachAsChildNode(value, "" + (change.index + idx))
          })

          // update paths
          for (let i = change.index + change.addedCount; i < change.object.length; i++) {
            const value = change.object[i]
            if (isPlainPrimitive(value)) {
              return
            }
            if (!isNode(value)) {
              throw failure("node expected")
            }
            mergeNodeData(value, {
              parent: { object: observableStruct, path: "" + i },
            })
          }
          break
        }

        default:
          throw failure(`unsupported change type`)
      }

      invalidateSnapshotTreeToRoot(observableStruct)
      emitChangeToRoot(observableStruct, change)
    })
  } else {
    observe(observableStruct, (change) => {
      if (typeof change.name === "symbol") {
        throw failure("symbol keys are not supported on a mobx-node node")
      }

      switch (change.type) {
        case "add": {
          attachAsChildNode(change.newValue, "" + change.name)
          break
        }

        case "update": {
          detachAsChildNode(change.oldValue)
          attachAsChildNode(change.newValue, "" + change.name)
          break
        }

        case "remove": {
          detachAsChildNode(change.oldValue)
          break
        }

        default:
          throw failure(`unsupported change type`)
      }

      invalidateSnapshotTreeToRoot(observableStruct)
      emitChangeToRoot(observableStruct, change)
    })
  }

  return observableStruct as unknown as T
}
