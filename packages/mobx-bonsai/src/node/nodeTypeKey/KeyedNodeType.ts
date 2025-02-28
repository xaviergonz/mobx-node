import { BaseTypedNodeType } from "./BaseTypedNodeType"
import { NodeKeyValue, NodeWithAnyType } from "./nodeType"

/**
 * Node type that uses a specific property as a unique key for each node
 *
 * @template TNode - Node structure that adheres to this type
 * @template TKey - Key field in the node structure
 * @template TOptional - Optional keys in the node structure
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
