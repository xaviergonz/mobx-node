import { DisposableDispose } from "../../utils/disposable"
import { BaseNodeType } from "./BaseNodeType"
import { NodeWithAnyType, NodeTypeKey } from "./nodeType"

/**
 * Represents a node type with associated lifecycle and behavior
 *
 * @template TNode - Node structure that adheres to this type
 * @template TKey - Key field in the node structure (if any)
 * @template TOther - Additional properties and methods
 */
export type BaseTypedNodeType<
  TNode extends NodeWithAnyType,
  TKey extends keyof TNode | never,
  TOther,
> = BaseNodeType<
  TNode,
  TKey,
  TOther & {
    /**
     * Unique identifier for this node type
     */
    typeId: TNode[NodeTypeKey]

    /**
     * Unregisters this node type
     */
    unregister(): void

    /**
     * Unregisters this node type (disposable pattern)
     */
    [Symbol.dispose](): void

    /**
     * Registers a callback to run when nodes of this type are initialized
     *
     * @param callback - Function to execute when a node is initialized
     *
     * @returns The same node type with the added initialization callback
     */
    onInit(callback: (node: TNode) => void): BaseTypedNodeType<TNode, TKey, TOther>

    _initNode(node: TNode): void
    _addOnInit(callback: (node: TNode) => void): DisposableDispose
  }
>
