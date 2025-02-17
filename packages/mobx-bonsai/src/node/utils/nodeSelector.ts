import { failure } from "../../error/failure"
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
  const selectNodeByProp = new Map<string, Map<any, NodeSelectorCallback<any>>>()
  const selectNodeFns: { selectNodeFn: SelectNodeFn; callback: NodeSelectorCallback<any> }[] = []

  const nodeSelector = {
    addSelectorWithCallback: <T extends object>(
      selectNode: SelectNodeByProp | SelectNodeByTypeProp | SelectNodeFn,
      callback: NodeSelectorCallback<T>
    ): Dispose => {
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
        return nodeSelector.addSelectorWithCallback(["$type", propValue], callback)
      }

      const selectNodeFn = selectNode
      const entry = { selectNodeFn, callback }
      selectNodeFns.push(entry)

      return disposeOnce(() => {
        const idx = selectNodeFns.indexOf(entry)
        if (idx > 0) {
          selectNodeFns.splice(idx, 1)
        }
      })
    },

    selectNodeCallback: (node: object) => {
      for (const [propName, propValueMap] of selectNodeByProp) {
        const propValue = (node as any)[propName]
        const callback = propValueMap.get(propValue)
        if (callback) {
          return callback
        }
      }

      for (const entry of selectNodeFns) {
        if (entry.selectNodeFn(node)) {
          return entry.callback
        }
      }

      return undefined
    },

    selectAndInvokeCallback: (node: object) => {
      const callback = nodeSelector.selectNodeCallback(node)
      if (callback) {
        callback(node)
      }
    },
  }

  return nodeSelector
}
