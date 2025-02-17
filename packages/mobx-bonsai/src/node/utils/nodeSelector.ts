import { Dispose, disposeOnce } from "../../utils/disposeOnce"

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
 * Callback invoked by a node selector.
 *
 * @param node - The selected node.
 */
export type NodeSelectorCallback<T extends object> = (node: T) => void

/**
 * @internal
 */
export const createNodeSelector = () => {
  const selectNodeByProp = new Map<string, Map<any, NodeSelectorCallback<any>[]>>()
  const selectNodeFns: { selectNodeFn: SelectNodeFn; callback: NodeSelectorCallback<any> }[] = []

  const nodeSelector = {
    addSelectorWithCallback: <T extends object>(
      selectNode: SelectNodeByProp | SelectNodeByTypeProp | SelectNodeFn,
      callback: NodeSelectorCallback<T>
    ): Dispose => {
      if (typeof selectNode === "string") {
        const propValue = selectNode
        return nodeSelector.addSelectorWithCallback(["$type", propValue], callback)
      }

      if (Array.isArray(selectNode)) {
        const [propName, propValue] = selectNode

        let propMap = selectNodeByProp.get(propName)
        if (!propMap) {
          propMap = new Map()
          selectNodeByProp.set(propName, propMap)
        }

        let callbacks = propMap.get(propValue)
        if (!callbacks) {
          callbacks = []
          propMap.set(propValue, callbacks)
        }

        callbacks.push(callback)

        return disposeOnce(() => {
          const idx = callbacks.indexOf(callback)
          if (idx >= 0) {
            callbacks.splice(idx, 1)
          }
        })
      }

      const selectNodeFn = selectNode
      const entry = { selectNodeFn, callback }
      selectNodeFns.push(entry)

      return disposeOnce(() => {
        const idx = selectNodeFns.indexOf(entry)
        if (idx >= 0) {
          selectNodeFns.splice(idx, 1)
        }
      })
    },

    selectNodeCallbacks: (node: object) => {
      const callbacks: NodeSelectorCallback<any>[] = []

      for (const [propName, propValueMap] of selectNodeByProp) {
        const propValue = (node as any)[propName]
        const callbacksForProp = propValueMap.get(propValue)
        if (callbacksForProp && callbacksForProp.length > 0) {
          callbacks.push(...callbacksForProp)
        }
      }

      for (const entry of selectNodeFns) {
        if (entry.selectNodeFn(node)) {
          callbacks.push(entry.callback)
        }
      }

      return callbacks
    },

    selectAndInvokeCallbacks: (node: object) => {
      nodeSelector.selectNodeCallbacks(node).forEach((callback) => {
        callback(node)
      })
    },
  }

  return nodeSelector
}
