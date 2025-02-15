import { failure } from "../error/failure"
import { Dispose, disposeOnce } from "../utils/disposeOnce"

const selectNodeByProp = new Map<string, Map<any, InitNodeCallback<any>>>()
const selectNodeFns: { selectNodeFn: SelectNodeFn; initCallback: InitNodeCallback<any> }[] = []

/**
 * @internal
 */
export function initNode<T extends object>(node: T): void {
  for (const [propName, propValueMap] of selectNodeByProp) {
    const propValue = (node as any)[propName]
    const callback = propValueMap.get(propValue)
    if (callback) {
      callback(node)
      return
    }
  }

  for (const entry of selectNodeFns) {
    if (entry.selectNodeFn(node)) {
      entry.initCallback(node)
      return
    }
  }
}

/**
 * A property name and its value used to select a node.
 */
export type SelectNodeByProp = [propName: string, propValue: any]

/**
 * A string representing the value the $type property has to have to select a node of that kind.
 * Shorthand for [ "$type", propValue ]
 */
export type SelectNodeByTypeProp = string

/**
 * A function that returns true if a node matches certain criteria.
 */
export type SelectNodeFn = (node: object) => boolean

/**
 * Callback invoked on node initialization.
 *
 * @param node - The node to initialize.
 */
export type InitNodeCallback<T extends object> = (node: T) => void

/**
 * Registers a callback to initialize a node based on selection criteria.
 *
 * The selection criteria can be:
 * - An array specifying a property name and its value.
 * - A string specifying the value of the $type property.
 * - A predicate function that tests if the given node should be selected.
 *
 * @param selectNode - The criteria for selecting the node.
 * @param callback - The initialization callback to be invoked when the node is created.
 * @returns A dispose function that unregisters the callback.
 */
export function onNodeInit<T extends object>(
  selectNode: SelectNodeByProp | SelectNodeByTypeProp | SelectNodeFn,
  callback: InitNodeCallback<T>
): Dispose {
  if (Array.isArray(selectNode)) {
    const [propName, propValue] = selectNode
    let propMap = selectNodeByProp.get(propName)
    if (!propMap) {
      propMap = new Map()
      selectNodeByProp.set(propName, propMap)
    }

    if (propMap.has(propValue)) {
      throw failure(`onNodeInit for ${propName}=${propValue} already registered`)
    }

    propMap.set(propValue, callback)

    return disposeOnce(() => {
      propMap!.delete(propValue)
    })
  }

  if (typeof selectNode === "string") {
    const propValue = selectNode
    return onNodeInit(["$type", propValue], callback)
  }

  const selectNodeFn = selectNode
  const entry = { selectNodeFn, initCallback: callback }
  selectNodeFns.push(entry)

  return disposeOnce(() => {
    const idx = selectNodeFns.indexOf(entry)
    if (idx > 0) {
      selectNodeFns.splice(idx, 1)
    }
  })
}
