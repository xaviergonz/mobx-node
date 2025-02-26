import { BaseNodeType } from "./BaseNodeType"

/**
 * A type that represents an untyped node type in the mobx-bonsai tree.
 *
 * @template TNode - The object type that represents the node's data structure.
 */
export type UntypedNodeType<TNode extends object> = BaseNodeType<
  TNode,
  never,
  {
    /**
     * Creates a node of this type with the type property automatically set
     *
     * @param data - Initial node data
     * @returns A node instance of this type
     */
    (data: TNode): TNode

    /**
     * Creates snapshot data of this type without instantiating a node
     *
     * @param data - Initial data
     * @returns A data snapshot with the type property set
     */
    snapshot(data: TNode): TNode
  }
>
