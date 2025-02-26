import { action, computed, IComputedValue, IComputedValueOptions } from "mobx"
import { failure } from "../error/failure"
import { Dispose, disposeOnce } from "../utils/disposeOnce"
import { assertIsNode, node } from "./node"
import mitt from "mitt"
import { MarkOptional } from "ts-essentials"
import { getGlobalConfig } from "../globalConfig"
import { volatileProp } from "./volatileProp"
import { PrependArgument } from "../utils/PrependArgument"

/**
 * Property key used to identify a node's type
 */
export const nodeTypeKey = "$$type"

/**
 * Type of the nodeTypeKey constant
 */
export type NodeTypeKey = typeof nodeTypeKey

/**
 * Value that identifies a node's type (string or number)
 */
export type NodeTypeValue = string | number

/**
 * Value that uniquely identifies a node instance (string or number)
 */
export type NodeKeyValue = string | number

/**
 * Represents any node that has a type designation
 */
export interface NodeWithAnyType {
  readonly [nodeTypeKey]: NodeTypeValue
}

/**
 * Combines a specific node type with additional data properties
 *
 * @template TType - The node's type identifier
 * @template TData - Additional data properties for the node
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
 * Attempts to register a node in the type/key registry
 *
 * @param node - The node to register
 * @returns True if registration was successful
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
 * Base node type definition with core functionality
 *
 * @template TNode - Node structure that adheres to this type
 * @template TKey - Key field in the node structure (if any)
 * @template TOther - Additional properties and methods
 */
export type BaseNodeType<TNode extends object, TKey extends keyof TNode | never, TOther> = {
  /**
   * Adds volatile state properties to nodes of this type
   *
   * Volatile state is not persisted in snapshots and is local to each node instance.
   *
   * @template TVolatiles - Record of volatile property getter functions
   * @param volatile - Object where each key defines a getter function for volatile state
   * @returns The same NodeType with added accessor methods for the volatile state
   */
  volatile<TVolatiles extends Record<string, () => any>>(
    volatile: TVolatiles
  ): BaseNodeType<TNode, TKey, TOther & VolatileAccessors<TVolatiles, TNode>>

  /**
   * Registers action methods for nodes of this type
   *
   * Actions are methods that can modify the node state and are automatically
   * wrapped in MobX actions for proper state tracking.
   *
   * @template TActions - Record of action methods
   * @param actions - Function that receives a node and returns an object of action methods
   * @returns The same NodeType with added action methods that accept a node as their first parameter
   */
  actions<TActions extends Record<string, (...args: any) => any>>(
    actions: (n: TNode) => TActions
  ): BaseNodeType<
    TNode,
    TKey,
    TOther & {
      [k in keyof TActions]: PrependArgument<TActions[k], TNode>
    }
  >

  /**
   * Registers getter methods for nodes of this type
   *
   * Getters are methods that derive values from the node state without modifying it.
   *
   * @template TGetters - Record of getter methods
   * @param getters - Function that receives a node and returns an object of getter methods
   * @returns The same NodeType with added getter methods that accept a node as their first parameter
   */
  getters<TGetters extends Record<string, (...args: any) => any>>(
    getters: (n: TNode) => TGetters
  ): BaseNodeType<
    TNode,
    TKey,
    TOther & {
      [k in keyof TGetters]: PrependArgument<TGetters[k], TNode>
    }
  >

  /**
   * Registers computed methods for nodes of this type
   *
   * Computed methods derive values from the node state and are automatically
   * memoized by MobX for performance optimization.
   *
   * @template TComputeds - Record of computed properties
   * @param computeds - Function that receives a node and returns an object of computed accessor methods
   * @returns The same NodeType with added computed methods that accept a node as their first parameter
   */
  computeds<TComputeds extends Record<string, ComputedEntry<any>>>(
    computeds: (n: TNode) => TComputeds
  ): BaseNodeType<
    TNode,
    TKey,
    TOther & {
      [k in keyof TComputeds]: TComputeds[k] extends () => any
        ? PrependArgument<TComputeds[k], TNode>
        : TComputeds[k] extends ComputedFnWithOptions<any>
          ? PrependArgument<TComputeds[k]["get"], TNode>
          : never
    }
  >
} & TOther

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
     * @returns Dispose function to remove the listener
     */
    onInit(callback: (node: TNode) => void): Dispose

    /**
     * @internal
     * @param node - Node to initialize
     */
    _initNode(node: TNode): void
  }
>

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

/**
 * Configuration for a computed property with options
 *
 * @template T - Return type of the computed value
 */
export type ComputedFnWithOptions<T> = { get: () => T } & Omit<
  IComputedValueOptions<T>,
  "get" | "set"
>

/**
 * Computed property definition that can be a function or configuration object
 *
 * @template T - Return type of the computed value
 */
export type ComputedEntry<T> = (() => T) | ComputedFnWithOptions<T>

/**
 * Generates accessor methods for volatile properties
 *
 * @template T - Record of volatile property getter functions
 * @template TNode - The node type these accessors operate on
 */
export type VolatileAccessors<T extends Record<string, () => any>, TNode> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (n: TNode, value: ReturnType<T[K]>) => void
} & {
  [K in keyof T as `get${Capitalize<string & K>}`]: (n: TNode) => ReturnType<T[K]>
} & {
  [K in keyof T as `reset${Capitalize<string & K>}`]: (n: TNode) => void
}

/**
 * A type representing any untyped node type.
 */
export type AnyUntypedNodeType = UntypedNodeType<any>

/**
 * Union of all possible typed node type objects
 */
export type AnyTypedNodeType = TypedNodeType<any> | KeyedNodeType<any, any>

/**
 * Union of all possible node type objects
 */
export type AnyNodeType = AnyUntypedNodeType | AnyTypedNodeType

/**
 * Extracts the node type from a NodeType instance
 *
 * @template T - A NodeType instance
 */
export type NodeForNodeType<T extends BaseNodeType<any, any, any>> = T extends BaseNodeType<
  infer TNode,
  any,
  any
>
  ? TNode
  : never

const registeredNodeTypes = new Map<NodeTypeValue, AnyTypedNodeType>()

/**
 * Retrieves the registered node type for a given type ID
 *
 * @param typeId - The node type identifier to look up
 * @returns The node type object or undefined if not found
 */
export function findNodeTypeById(typeId: NodeTypeValue): AnyNodeType | undefined {
  return registeredNodeTypes.get(typeId)
}

export function getNodeTypeId<TNode extends NodeWithAnyType>(node: TNode): TNode[NodeTypeKey]
export function getNodeTypeId(node: object): NodeTypeValue | undefined

/**
 * Gets the type identifier of a node
 *
 * @param node - The node to get the type from
 * @returns The node's type identifier or undefined
 */
export function getNodeTypeId(node: object): NodeTypeValue | undefined {
  return (node as any)[nodeTypeKey]
}

export function getNodeTypeAndKey<TNode extends NodeWithAnyType>(
  node: TNode
): {
  type: AnyTypedNodeType
  key: NodeKeyValue | undefined
}
export function getNodeTypeAndKey(node: object): {
  type: AnyTypedNodeType | undefined
  key: NodeKeyValue | undefined
}

/**
 * Gets both the type object and key value for a node
 *
 * @param node - The node to extract type and key from
 * @returns Object containing the node's type and key
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
    key: "getKey" in type ? type.getKey(node as NodeWithAnyType) : undefined,
  }
}

export function nodeType<TNode extends NodeWithAnyType = never>(
  type: TNode[NodeTypeKey]
): TypedNodeType<TNode>
export function nodeType<TNode extends object = never>(): UntypedNodeType<TNode>

/**
 * Creates and registers a new node type
 *
 * @template TNode - The node structure that will adhere to this type
 * @param type - Unique identifier for this node type
 * @returns A typed node factory with associated methods
 */
export function nodeType<TNode extends object = never>(
  type?: TNode extends NodeWithAnyType ? TNode[NodeTypeKey] : never
): TNode extends NodeWithAnyType ? TypedNodeType<TNode> : UntypedNodeType<TNode> {
  return type !== undefined ? (typedNodeType<NodeWithAnyType>(type) as any) : untypedNodeType()
}

/**
 * @internal
 * Adds extension methods (volatile, actions, getters, computeds) to a node type object
 *
 * @param nodeTypeObj - The node type object to extend
 */
function addNodeTypeExtensionMethods<TNode extends object>(
  nodeTypeObj: Partial<BaseNodeType<TNode, any, unknown>>
): void {
  nodeTypeObj.volatile = (volatiles) => {
    const result = nodeTypeObj as any

    for (const volatileKey of Object.keys(volatiles)) {
      const defaultValueGen = volatiles[volatileKey]
      const [getter, setter, resetter] = volatileProp(defaultValueGen)

      const capitalizedVolatileKey = volatileKey.charAt(0).toUpperCase() + volatileKey.slice(1)
      result[`get${capitalizedVolatileKey}`] = getter
      result[`set${capitalizedVolatileKey}`] = setter
      result[`reset${capitalizedVolatileKey}`] = resetter
    }

    return nodeTypeObj as any
  }

  nodeTypeObj.actions = (getActions) => {
    const result = nodeTypeObj as any

    const cachedActions = new WeakMap<object, Record<string, (...args: any[]) => any>>()

    for (const key of Object.keys(getActions(undefined as any))) {
      result[key] = action((n: TNode, ...args: any[]) => {
        let cachedActionsForNode = cachedActions.get(n)
        if (!cachedActionsForNode) {
          const actions = getActions(n)
          Object.entries(actions).forEach(([key, value]) => {
            if (typeof value !== "function") {
              throw failure(`action property '${key}' must be a function`)
            }
          })
          cachedActionsForNode = actions
          cachedActions.set(n, cachedActionsForNode)
        }

        return cachedActionsForNode[key](...args)
      })
    }

    return nodeTypeObj as any
  }

  nodeTypeObj.getters = (getGetters) => {
    const result = nodeTypeObj as any

    const cachedGetters = new WeakMap<object, Record<string, (...args: any) => any>>()

    for (const key of Object.keys(getGetters(undefined as any))) {
      result[key] = (n: TNode, ...args: any[]) => {
        let cachedGettersForNode = cachedGetters.get(n)
        if (!cachedGettersForNode) {
          const getters = getGetters(n)
          Object.entries(getters).forEach(([key, value]) => {
            if (typeof value !== "function") {
              throw failure(`getter property '${key}' must be a function`)
            }
          })
          cachedGettersForNode = getters
          cachedGetters.set(n, cachedGettersForNode)
        }

        return cachedGettersForNode[key](...args)
      }
    }

    return nodeTypeObj as any
  }

  nodeTypeObj.computeds = (getComputeds) => {
    const result = nodeTypeObj as any

    const cachedComputeds = new WeakMap<object, Record<string, IComputedValue<unknown>>>()

    for (const key of Object.keys(getComputeds(undefined as any))) {
      result[key] = (n: TNode) => {
        let cachedComputedsForNode = cachedComputeds.get(n)
        if (!cachedComputedsForNode) {
          const computedFns: Record<string, IComputedValue<any>> = {}
          Object.entries(getComputeds(n)).forEach(([key, value]) => {
            if (typeof value === "function") {
              computedFns[key] = computed(() => value())
            } else if (
              typeof value === "object" &&
              "get" in value &&
              typeof value.get === "function"
            ) {
              const options = { ...value, get: undefined }
              computedFns[key] = computed(value.get, options)
            } else {
              throw failure(
                `computed property '${key}' must be a function or a configuration object with a 'get' method`
              )
            }
          })
          cachedComputedsForNode = computedFns
          cachedComputeds.set(n, cachedComputedsForNode)
        }

        return cachedComputedsForNode[key].get()
      }
    }

    return nodeTypeObj as any
  }
}

function typedNodeType<TNode extends NodeWithAnyType = never>(
  type: TNode[NodeTypeKey]
): TypedNodeType<TNode> {
  if (type && registeredNodeTypes.has(type)) {
    throw failure(`node type '${type}' is already registered`)
  }

  const events = mitt<{
    init: TNode
  }>()

  const snapshot = (data: MarkOptional<TNode, NodeTypeKey>) => {
    const sn = {
      ...data,
      [nodeTypeKey]: type,
    } as TNode

    // generate key if missing
    if (keyedNodeTypeObj.key !== undefined) {
      const key = keyedNodeTypeObj.getKey(sn)
      if (key === undefined) {
        ;(sn as any)[keyedNodeTypeObj.key] = getGlobalConfig().keyGenerator()
      }
    }

    return sn
  }

  const nodeTypeObj: Partial<TypedNodeType<TNode>> = (data: MarkOptional<TNode, NodeTypeKey>) => {
    return node(snapshot(data)) as TNode
  }
  const keyedNodeTypeObj = nodeTypeObj as unknown as KeyedNodeType<TNode, keyof TNode>

  nodeTypeObj.snapshot = snapshot

  nodeTypeObj.typeId = type

  nodeTypeObj.withKey = (key) => {
    if (keyedNodeTypeObj.key !== undefined) {
      throw failure(`node type already has a key`)
    }

    keyedNodeTypeObj.key = key

    keyedNodeTypeObj.getKey = (node) => {
      return keyedNodeTypeObj.key === undefined
        ? undefined
        : (node[keyedNodeTypeObj.key] as NodeKeyValue)
    }

    keyedNodeTypeObj.findByKey = (key) => {
      const typeMap = nodeByTypeAndKey.get(type)
      if (!typeMap) {
        return undefined
      }

      const ref = typeMap.get(key)

      return ref?.deref() as TNode | undefined
    }

    return keyedNodeTypeObj as any
  }

  nodeTypeObj.unregister = disposeOnce(() => {
    registeredNodeTypes.delete(type)
  })

  nodeTypeObj[Symbol.dispose] = () => {
    nodeTypeObj.unregister!()
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

  addNodeTypeExtensionMethods(nodeTypeObj)

  registeredNodeTypes.set(type, nodeTypeObj as AnyTypedNodeType)

  return nodeTypeObj as TypedNodeType<TNode>
}

function untypedNodeType<TNode extends object = never>(): UntypedNodeType<TNode> {
  const snapshot = (data: TNode) => data

  const nodeTypeObj: Partial<UntypedNodeType<TNode>> = (data: TNode) => node(snapshot(data))

  nodeTypeObj.snapshot = snapshot

  addNodeTypeExtensionMethods(nodeTypeObj)

  return nodeTypeObj as UntypedNodeType<TNode>
}
