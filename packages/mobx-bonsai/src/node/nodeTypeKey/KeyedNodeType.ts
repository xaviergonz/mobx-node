import { MarkOptional } from "ts-essentials"
import { BaseTypedNodeType } from "./BaseTypedNodeType"
import { NodeWithAnyType, NodeTypeKey, NodeKeyValue } from "./nodeTypeKey"

/**
 * Node type that uses a specific property as a unique key for each node
 *
 * @template TNode - Node structure that adheres to this type
 * @template TKey - Key field in the node structure
 * @template TOther - Additional properties and methods
 */

export type KeyedNodeType<
  TNode extends NodeWithAnyType,
  TKey extends keyof TNode,
> = BaseTypedNodeType<
  TNode,
  TKey,
  {
    /**
     * Creates a node of this type with the type property automatically set
     *
     * @param data - Initial node data
     * @returns A node instance of this type
     */
    (data: MarkOptional<TNode, NodeTypeKey | TKey>): TNode

    /**
     * Creates snapshot data of this type without instantiating a node
     *
     * @param data - Initial data
     * @returns A data snapshot with the type property set
     */
    snapshot(data: MarkOptional<TNode, NodeTypeKey | TKey>): TNode

    /**
     * Property name containing the node's unique key
     */
    key: TKey

    /**
     * Gets the unique key value for a node
     *
     * @param node - Node to get the key from
     * @returns The node's key value or undefined
     */
    getKey(node: TNode): NodeKeyValue | undefined

    /**
     * Retrieves a node by its key (if it exists)
     *
     * @param key - Key to search for
     * @returns The node with the specified key or undefined
     */
    findByKey(key: NodeKeyValue): TNode | undefined
  }
>
