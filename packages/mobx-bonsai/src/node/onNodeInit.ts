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
  initNodeNodeSelector.selectAndInvokeCallback(node)
}

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
  callback: NodeSelectorCallback<T>
): Dispose {
  return initNodeNodeSelector.addSelectorWithCallback(selectNode, callback)
}
