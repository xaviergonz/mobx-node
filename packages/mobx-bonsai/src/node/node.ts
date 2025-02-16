import {
  IArrayDidChange,
  IAtom,
  IObjectDidChange,
  ObservableSet,
  action,
  createAtom,
  isObservableArray,
  observable,
  observe,
  set,
} from "mobx"
import { isObservablePlainStructure, isPrimitive } from "../plainTypes/checks"
import { failure } from "../error/failure"
import { invalidateSnapshotTreeToRoot } from "./snapshot/getSnapshot"
import { buildNodeFullPath } from "./utils/buildNodeFullPath"
import { getParent } from "./tree/getParent"
import { Dispose, disposeOnce } from "../utils/disposeOnce"
import { initNode } from "./onNodeInit"

type ParentNode = {
  object: object
  path: string
}

export type NodeChange = IObjectDidChange | IArrayDidChange

export type NodeChangeListener = (change: NodeChange) => void

type NodeData = {
  parent: ParentNode | undefined
  parentAtom: IAtom | undefined
  onChangeListeners: NodeChangeListener[]
  childrenObjects: ObservableSet<object>
}

/**
 * @internal
 */
export function getNodeData(node: object): NodeData {
  assertIsNode(node, "node")
  return nodes.get(node)!
}

/**
 * @internal
 */
export function reportNodeParentObserved(node: object): void {
  const data = getNodeData(node)
  if (!data.parentAtom) {
    data.parentAtom = createAtom("parent")
  }
  data.parentAtom.reportObserved()
}

const nodes = new WeakMap<object, NodeData>()

function setParentNode(node: object, parentNode: ParentNode | undefined): void {
  const nodeData = getNodeData(node)
  nodeData.parent = parentNode
  nodeData.parentAtom?.reportChanged()
}

export function isNode(struct: object): boolean {
  return nodes.has(struct as object)
}

export function assertIsNode(node: object, argName: string): void {
  if (!isNode(node)) {
    throw failure(`${argName} must be a mobx-bonsai node`)
  }
}

function emitChange(eventTarget: object, change: IObjectDidChange | IArrayDidChange) {
  const changeListeners = getNodeData(eventTarget).onChangeListeners
  if (changeListeners.length > 0) {
    changeListeners.forEach((listener) => {
      listener(change)
    })
  }
}

function emitChangeToRoot(eventTarget: object, change: IObjectDidChange | IArrayDidChange) {
  let currentTarget: object | undefined = eventTarget
  while (currentTarget) {
    emitChange(currentTarget, change)
    currentTarget = getParent(currentTarget)
  }
}

/**
 * Registers a deep change listener on the provided node.
 *
 * The listener is invoked whenever the node undergoes a change, such as additions,
 * updates, or removals within its observable structure. This includes receiving
 * events from both object and array mutations.
 *
 * @param node - The node to attach the change listener to.
 * @param listener - The callback function that is called when a change occurs.
 *   The listener receives two parameters:
 *   - changeTarget: The node where the change occurred.
 *   - change: The change event, which is a NodeChange.
 *
 * @returns A disposer function that, when invoked, unregisters the listener.
 */
export function onDeepChange(node: object, listener: NodeChangeListener): Dispose {
  const changeListeners = getNodeData(node).onChangeListeners
  changeListeners.push(listener)

  return disposeOnce(() => {
    const index = changeListeners.indexOf(listener)
    if (index !== -1) {
      changeListeners.splice(index, 1)
    }
  })
}

/**
 * Converts a plain/observable object or array into a mobx-bonsai node.
 *
 * @param struct - The object or array to be converted.
 * @param options - Optional configuration object.
 * @property {boolean} [skipInit] - If true, skips the initialization phase.
 *
 * @returns The node, an enhanced observable structure.
 */
export const node = action(
  <T extends object>(
    struct: T,
    options?: {
      skipInit?: boolean
    }
  ): T => {
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

    const nodeData: NodeData = {
      parent: undefined,
      parentAtom: undefined,
      onChangeListeners: [],
      childrenObjects: observable.set([], {
        deep: false,
      }),
    }

    nodes.set(observableStruct, nodeData)

    const attachAsChildNode = (v: any, path: string, set?: (n: object) => void) => {
      if (isPrimitive(v)) {
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
              ` but it already exists at ${JSON.stringify(buildNodeFullPath(parent.object, parent.path))}.` +
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

      nodeData.childrenObjects.add(n)

      setParentNode(n, { object: observableStruct, path })
    }

    const detachAsChildNode = (v: any) => {
      if (isPrimitive(v)) {
        return
      }

      if (!isNode(v)) {
        throw failure("node expected")
      }

      setParentNode(v, undefined)

      nodeData.childrenObjects.delete(v)
    }

    const isArray = isObservableArray(observableStruct)

    // make current children nodes too (init)
    if (isArray) {
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
    if (isArray) {
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
              if (isPrimitive(value)) {
                return
              }
              if (!isNode(value)) {
                throw failure("node expected")
              }
              setParentNode(value, { object: observableStruct, path: "" + i })
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
          throw failure("symbol keys are not supported on a mobx-bonsai node")
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

    // init node if needed
    const skipInit = options?.skipInit ?? false
    if (!skipInit) {
      initNode(observableStruct)
    }

    return observableStruct as unknown as T
  }
)
