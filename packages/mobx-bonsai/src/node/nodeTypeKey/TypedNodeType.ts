import { MarkOptional } from "ts-essentials"
import { BaseTypedNodeType } from "./BaseTypedNodeType"
import { NodeWithAnyType, NodeTypeKey } from "./nodeTypeKey"
import { KeyedNodeType } from "./KeyedNodeType"

/**
 * Represents a node type with associated lifecycle and behavior
 *
 * @template TNode - Node structure that adheres to this type
 * @template TKey - Key field in the node structure (if any)
 * @template TOther - Additional properties and methods
 */
export type TypedNodeType<TNode extends NodeWithAnyType> = BaseTypedNodeType<
  TNode,
  never,
  {
    /**
     * Creates a node of this type with the type property automatically set
     *
     * @param data - Initial node data
     * @returns A node instance of this type
     */
    (data: MarkOptional<TNode, NodeTypeKey>): TNode

    /**
     * Creates snapshot data of this type without instantiating a node
     *
     * @param data - Initial data
     * @returns A data snapshot with the type property set
     */
    snapshot(data: MarkOptional<TNode, NodeTypeKey>): TNode

    /**
     * Configures this type to use a specific property as the node key
     *
     * @template TKey - Property key in the node type
     * @param key - Property name to use as the node key
     * @returns A keyed node type using the specified property as key
     */
    withKey<TKey extends keyof TNode>(key: TKey): KeyedNodeType<TNode, TKey>
  }
>
