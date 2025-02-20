import { Dispose, disposeOnce } from "../../utils/disposeOnce"
import { NodeType, nodeType } from "../nodeTypeKey"

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
  const selectNodeByType = new Map<any, NodeSelectorCallback<any>[]>()

  const nodeSelector = {
    addSelectorWithCallback: <T extends object>(
      type: NodeType,
      callback: NodeSelectorCallback<T>
    ): Dispose => {
      let callbacks = selectNodeByType.get(type)
      if (!callbacks) {
        callbacks = []
        selectNodeByType.set(type, callbacks)
      }

      callbacks.push(callback)

      return disposeOnce(() => {
        const idx = callbacks.indexOf(callback)
        if (idx >= 0) {
          callbacks.splice(idx, 1)
        }
      })
    },

    selectNodeCallbacks: (node: object) => {
      const callbacks: NodeSelectorCallback<any>[] = []

      const callbacksForProp = selectNodeByType.get((node as any)[nodeType])
      if (callbacksForProp && callbacksForProp.length > 0) {
        callbacks.push(...callbacksForProp)
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

/**
 * @internal
 */
export type NodeSelector = ReturnType<typeof createNodeSelector>
