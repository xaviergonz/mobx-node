import { action } from "mobx"
import { failure } from "../error/failure"
import { Dispose, disposeOnce } from "../utils/disposeOnce"
import { assertIsNode, node } from "./node"
import mitt from "mitt"
import { IsNever, MarkOptional } from "ts-essentials"

/**
 * A unique key indicating the type of a node. This constant is used internally to identify node types.
 */
export const nodeTypeKey = "$$type"

/**
 * A type alias that represents the type of the `nodeType` constant.
 */
export type NodeTypeKey = typeof nodeTypeKey

/**
 * Represents a node's type value, which can be either a string or a number.
 *
 * This alias is defined to allow flexibility in specifying node types, accommodating both textual
 * identifiers and numerical values.
 */
export type NodeTypeValue = string | number

/**
 * A type alias representing a node key value.
 *
 * This type is used to uniquely identify nodes and can be either a string or a number.
 */
export type NodeKeyValue = string | number

/**
 * Represents a node that includes a type designation.
 */
export interface NodeWithAnyType {
  readonly [nodeTypeKey]: NodeTypeValue
}

/**
 * Represents a node with a specific type and additional data.
 *
 * This type combines a readonly property identified by the symbol
 * [nodeType] (of type TType) with extra data properties defined by TData.
 *
 * @template TType - A subtype of NodeTypeValue that specifies the node's type.
 * @template TData - An object type providing additional data for the node.
 */
export type TNode<TType extends NodeTypeValue, TData> = {
  readonly [nodeTypeKey]: TType
} & TData

const nodeByTypeAndKey = new Map<NodeTypeValue, Map<NodeKeyValue, WeakRef<object>>>()

const finalizationRegistry = new FinalizationRegistry(
  ({
    typeId,
    key,
  }: {
    typeId: NodeTypeValue
    key: NodeKeyValue
  }) => {
    const typeMap = nodeByTypeAndKey.get(typeId)
    if (!typeMap) {
      // already gone
      return
    }

    const ref = typeMap.get(key)
    if (!ref) {
      // already gone
      return
    }

    if (ref.deref()) {
      // still alive
      return
    }

    // dead and should be removed
    typeMap.delete(key)
    if (typeMap.size === 0) {
      nodeByTypeAndKey.delete(typeId)
    }
  }
)

/**
 * @internal
 */
export function tryRegisterNodeByTypeAndKey(node: object): boolean {
  assertIsNode(node, "node")

  const { type, key } = getNodeTypeAndKey(node)
  if (type === undefined || key === undefined) {
    return false
  }
  const { typeId } = type

  let typeMap = nodeByTypeAndKey.get(typeId)
  if (!typeMap) {
    typeMap = new Map()
    nodeByTypeAndKey.set(typeId, typeMap)
  }

  typeMap.set(key, new WeakRef(node))
  finalizationRegistry.register(node, { typeId, key })

  return true
}

/**
 * Represents a node type with associated behavior for node management.
 *
 * @template TNode An object representing the node which should adhere to this node type.
 */
export interface NodeType<TNode extends NodeWithAnyType, TKey extends keyof TNode | never = never> {
  /**
   * Unique type identifier.
   */
  typeId: TNode[NodeTypeKey]

  /**
   * The property name that contains the unique key of the node, if any.
   */
  key: IsNever<TKey> extends true ? undefined : TKey

  /**
   * Create a new node of this type. This is the same as calling `node` but with
   * the node type property already set.
   *
   * @param data The node data.
   */
  (data: MarkOptional<TNode, NodeTypeKey | TKey>): TNode

  /**
   * Create snapshot data of this type. This is the same as the given object but with
   * the node type property already set.
   *
   * @param data The data.
   */
  snapshot(data: MarkOptional<TNode, NodeTypeKey>): TNode

  /**
   * Retrieves the key associated with the given node.
   *
   * @param node The node for which to retrieve the key.
   * @returns The unique key value of the node.
   */
  getKey(node: TNode): NodeKeyValue | undefined

  /**
   * Finds a node by its unique key.
   *
   * @param key The key of the node.
   * @returns The node if found; otherwise, undefined.
   */
  findByKey(key: NodeKeyValue): TNode | undefined

  /**
   * Registers a callback to be invoked upon node initialization.
   *
   * @param callback A function that receives the node during initialization.
   * @returns A dispose function to remove the callback when no longer needed.
   */
  onInit(callback: (node: TNode) => void): Dispose

  /**
   * Unregisters this node type.
   * Once unregistered, the node type is removed from the internal registry.
   */
  unregister(): void

  /**
   * Unregisters this node type.
   * Once unregistered, the node type is removed from the internal registry.
   */
  [Symbol.dispose](): void

  /**
   * @internal
   */
  _initNode(node: TNode): void

  /**
   * Customizes this NodeType instance by specifying additional options.
   *
   * This method returns the same NodeType instance typed with the specified key property configuration.
   * When provided, the key property will be used for node key retrieval, enabling unique identification.
   *
   * @template TConfig - Options object that may include a `key` property.
   * @param options An object containing additional node type options.
   * @returns The same NodeType instance, but with a proper type for the given config.
   */
  with<
    TConfig extends {
      key?: keyof TNode
    },
  >(options: TConfig): NodeType<TNode, TConfig["key"] extends keyof TNode ? TConfig["key"] : never>
}

/**
 * Represents any node type.
 */
export type AnyNodeType = NodeType<NodeWithAnyType>

/**
 * Extracts the node type associated with a given {@link NodeType} instance.
 *
 * This utility type uses conditional types to infer the node type parameter (TNode)
 * from a provided NodeType instance. If the generic type does not match the expected structure,
 * the resulting type will be `never`.
 *
 * @template T A {@link NodeType} instance from which to extract the node type.
 * @returns The associated node type (TNode) of the provided {@link NodeType} instance.
 */
export type NodeForNodeType<T extends NodeType<any, any>> = T extends NodeType<infer TNode>
  ? TNode
  : never

const registeredNodeTypes = new Map<NodeTypeValue, NodeType<any, any>>()

/**
 * Retrieves the registered node type corresponding to the specified node type ID.
 *
 * @param typeId The unique node type identifier.
 * @returns The node type object associated with the provided type, or `undefined` if no matching node type is registered.
 */
export function findNodeTypeById(typeId: NodeTypeValue): AnyNodeType | undefined {
  return registeredNodeTypes.get(typeId)
}

export function getNodeTypeId<TNode extends NodeWithAnyType>(node: TNode): TNode[NodeTypeKey]
export function getNodeTypeId(node: object): NodeTypeValue | undefined

/**
 * Retrieves the node type identifier from the given node object.
 *
 * This function accesses the value associated with the node type key on the provided object.
 *
 * @param node - The object from which to extract the node type identifier.
 * @returns The node type identifier if available; otherwise, returns undefined.
 */
export function getNodeTypeId(node: object): NodeTypeValue | undefined {
  return (node as any)[nodeTypeKey]
}

export function getNodeTypeAndKey<TNode extends NodeWithAnyType>(
  node: TNode
): {
  type: AnyNodeType
  key: NodeKeyValue | undefined
}
export function getNodeTypeAndKey(node: object): {
  type: AnyNodeType | undefined
  key: NodeKeyValue | undefined
}

/**
 * Retrieves the node type and key of the specified node, if any.
 *
 * @param node The node from which to retrieve the node type and key.
 * @returns The corresponding NodeType and key if found.
 */
export function getNodeTypeAndKey(node: object): {
  type: AnyNodeType | undefined
  key: NodeKeyValue | undefined
} {
  const typeValue = getNodeTypeId(node)
  if (typeValue === undefined) {
    return {
      type: undefined,
      key: undefined,
    }
  }

  const type = findNodeTypeById(typeValue)
  if (type === undefined) {
    throw failure(`a node with type '${typeValue}' was found, but such type is not registered`)
  }

  return {
    type,
    key: type.getKey(node as NodeWithAnyType),
  }
}

/**
 * Registers a new node type with the specified configuration.
 *
 * This function registers a node type by adding it to an internal registry.
 * If the provided node type already exists in the registry, an error is thrown.
 *
 * @param options An object containing the node type configuration.
 * @param options.type A unique identifier for the node type.
 *
 * @returns A NodeType<T> object representing the registered node type.
 *
 * @throws Error if the node type identified by the provided type is already registered.
 */
export function nodeType<TNode extends NodeWithAnyType = never>(
  type: TNode[NodeTypeKey]
): NodeType<TNode> {
  if (registeredNodeTypes.has(type)) {
    throw failure(`node type '${type}' is already registered`)
  }

  const events = mitt<{
    init: TNode
  }>()

  const snapshot = (data: MarkOptional<TNode, NodeTypeKey>) => {
    return {
      ...data,
      [nodeTypeKey]: type,
    } as TNode
  }

  const nodeTypeObj: NodeType<TNode> = (data: MarkOptional<TNode, NodeTypeKey>) => {
    return node(snapshot(data)) as TNode
  }

  nodeTypeObj.snapshot = snapshot

  nodeTypeObj.typeId = type
  nodeTypeObj.key = undefined

  nodeTypeObj.with = ({ key }) => {
    nodeTypeObj.key = key as any
    return nodeTypeObj as any
  }

  nodeTypeObj.unregister = disposeOnce(() => {
    registeredNodeTypes.delete(type)
  })

  nodeTypeObj[Symbol.dispose] = () => {
    nodeTypeObj.unregister()
  }

  nodeTypeObj.getKey = (node) => {
    return nodeTypeObj.key === undefined ? undefined : (node[nodeTypeObj.key] as NodeKeyValue)
  }

  nodeTypeObj.findByKey = (key) => {
    const typeMap = nodeByTypeAndKey.get(type)
    if (!typeMap) {
      return undefined
    }

    const ref = typeMap.get(key)

    return ref?.deref() as TNode | undefined
  }

  nodeTypeObj.onInit = (callback) => {
    const actionCallback = action(callback)

    events.on("init", actionCallback)

    return () => {
      events.off("init", actionCallback)
    }
  }

  nodeTypeObj._initNode = (node: TNode) => {
    events.emit("init", node)
  }

  registeredNodeTypes.set(type, nodeTypeObj as NodeType<any, any>)

  return nodeTypeObj
}
