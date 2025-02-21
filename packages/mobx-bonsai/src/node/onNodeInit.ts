import { action } from "mobx"
import { Dispose } from "../utils/disposeOnce"
import { NodeSelectorCallback, createNodeSelector } from "./utils/nodeSelector"
import { NodeType, NodeWithType } from "./nodeTypeKey"

const initNodeNodeSelector = createNodeSelector()

/**
 * @internal
 */
export function initNode<T extends object>(node: T): void {
  initNodeNodeSelector.selectAndInvokeCallbacks(node)
}

/**
 * Registers a callback to initialize a node based on its $$type.
 *
 * @param nodeType The node type for which to invoke this initialization callback.
 * @param callback The initialization callback to be invoked when the node is created.
 * @returns A dispose function that unregisters the callback.
 */
export function onNodeInit<T extends NodeWithType>(
  nodeType: NodeType,
  callback: NodeSelectorCallback<T>
): Dispose {
  return initNodeNodeSelector.addSelectorWithCallback(nodeType, action(callback))
}
