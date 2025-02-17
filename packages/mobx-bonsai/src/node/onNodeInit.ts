import { action } from "mobx"
import { Dispose } from "../utils/disposeOnce"
import {
  NodeSelectorCallback,
  SelectNodeByProp,
  SelectNodeByTypeProp,
  SelectNodeFn,
  createNodeSelector,
} from "./utils/nodeSelector"

const initNodeNodeSelector = createNodeSelector()

/**
 * @internal
 */
export function initNode<T extends object>(node: T): void {
  initNodeNodeSelector.selectAndInvokeCallbacks(node)
}

/**
 * Registers a callback to initialize a node based on selection criteria.
 *
 * The selection criteria can be:
 * - A tuple specifying a property name and its value.
 * - A string specifying the value of the $type property.
 * - A predicate function that tests if the given node should be selected.
 * Note that using a tuple or string selector is way faster than using a function selector.
 *
 * @param nodeSelector - The criteria for selecting the node.
 * @param callback - The initialization callback to be invoked when the node is created.
 * @returns A dispose function that unregisters the callback.
 */
export function onNodeInit<T extends object>(
  nodeSelector: SelectNodeByProp | SelectNodeByTypeProp | SelectNodeFn,
  callback: NodeSelectorCallback<T>
): Dispose {
  return initNodeNodeSelector.addSelectorWithCallback(nodeSelector, action(callback))
}
