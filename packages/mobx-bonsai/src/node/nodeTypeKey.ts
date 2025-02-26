import { action, computed, IComputedValue, IComputedValueOptions } from "mobx"
import { failure } from "../error/failure"
import { Dispose, disposeOnce } from "../utils/disposeOnce"
import { assertIsNode, node } from "./node"
import mitt from "mitt"
import { IsNever, MarkOptional } from "ts-essentials"
import { getGlobalConfig } from "../globalConfig"
import { volatileProp } from "./volatileProp"
import { PrependArgument } from "../utils/PrependArgument"

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
export type NodeType<
  TNode extends NodeWithAnyType,
  TKey extends keyof TNode | never = never,
  TOther = unknown,
> = {
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
  snapshot(data: MarkOptional<TNode, NodeTypeKey | TKey>): TNode

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
  >(
    options: TConfig
  ): NodeType<TNode, TConfig["key"] extends keyof TNode ? TConfig["key"] : never, TOther>

  /**
   * Registers volatile state for nodes of this type.
   *
   * Volatile state is not persisted in snapshots and is local to a particular node instance.
   * This method creates getter, setter, and reset functions for each volatile property.
   *
   * @param volatile An object where each key defines a getter function for volatile state
   * @returns The same NodeType with added accessor methods for the volatile state
   */
  volatile<TVolatiles extends Record<string, () => any>>(
    volatile: TVolatiles
  ): NodeType<TNode, TKey, TOther & VolatileAccessors<TVolatiles, TNode>>

  /**
   * Registers action methods for nodes of this type.
   *
   * Actions are methods that can modify the node state and are automatically
   * wrapped in MobX actions for proper state tracking.
   *
   * @param actions A function that receives a node and returns an object of action methods
   * @returns The same NodeType with added action methods that accept a node as their first parameter
   */
  actions<TActions extends Record<string, (...args: any) => any>>(
    actions: (n: TNode) => TActions
  ): NodeType<
    TNode,
    TKey,
    TOther & {
      [k in keyof TActions]: PrependArgument<TActions[k], TNode>
    }
  >

  /**
   * Registers getter methods for nodes of this type.
   *
   * Getters are methods that derive values from the node state without modifying it.
   *
   * @param getters A function that receives a node and returns an object of getter methods
   * @returns The same NodeType with added getter methods that accept a node as their first parameter
   */
  getters<TGetters extends Record<string, (...args: any) => any>>(
    getters: (n: TNode) => TGetters
  ): NodeType<
    TNode,
    TKey,
    TOther & {
      [k in keyof TGetters]: PrependArgument<TGetters[k], TNode>
    }
  >

  /**
   * Registers computed methods for nodes of this type.
   *
   * Computed methods derive values from the node state and are automatically
   * memoized by MobX for performance optimization.
   *
   * Computed properties can be defined in two ways:
   * 1. As simple getter functions: `getLength() { return n.title.length }`
   * 2. As configuration objects: `getLength: { get() { return n.title.length }, equals: customComparer }`
   *
   * When using the configuration object form, you can specify additional MobX computed options
   * such as `equals`, `requiresReaction`, `keepAlive`, and `context`.
   *
   * @param computeds A function that receives a node and returns an object of computed accessor methods
   * @returns The same NodeType with added computed methods that accept a node as their first parameter
   */
  computeds<TComputeds extends Record<string, ComputedEntry<any>>>(
    computeds: (n: TNode) => TComputeds
  ): NodeType<
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
 * Represents a computed property with configuration options.
 * This type combines a required getter function with optional MobX computed configuration options.
 *
 * @template T - The return type of the computed value
 *
 * Properties include:
 * - `get`: Required function that returns the computed value
 * - MobX computed options (excluding 'get' and 'set'):
 *   - `equals`: Optional custom equality comparer function
 *   - `requiresReaction`: Optional flag to throw when the computed is accessed outside a reactive context
 *   - `keepAlive`: Optional flag to prevent garbage collection when not observed
 *   - `context`: Optional context object for the getter function
 */
export type ComputedFnWithOptions<T> = { get: () => T } & Omit<
  IComputedValueOptions<T>,
  "get" | "set"
>

/**
 * Represents a computed property definition that can be used with the `computeds` method.
 *
 * @template T - The return type of the computed value
 *
 * Can be defined in two ways:
 * 1. As a simple getter function: `() => T`
 * 2. As a configuration object with a getter and optional MobX settings: `{ get: () => T, ... }`
 *
 * Example with a simple getter:
 * ```
 * getFullName: () => `${n.firstName} ${n.lastName}`
 * ```
 *
 * Example with configuration options:
 * ```
 * getFilteredItems: {
 *   get: () => n.items.filter(i => i.active),
 *   equals: comparer.shallow,
 *   requiresReaction: true,
 *   keepAlive: false
 * }
 * ```
 */
export type ComputedEntry<T> = (() => T) | ComputedFnWithOptions<T>

/**
 * Utility type that generates getter, setter, and reset accessors for volatile properties.
 *
 * For each key in the source record, three methods are created:
 * - `getX` - Retrieves the volatile property value
 * - `setX` - Sets the volatile property to a new value
 * - `resetX` - Resets the volatile property to its initial value
 *
 * @template T - Record of getter functions for volatile properties
 * @template TNode - The node type associated with these accessors
 */
export type VolatileAccessors<T extends Record<string, () => any>, TNode> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (n: TNode, value: ReturnType<T[K]>) => void
} & {
  [K in keyof T as `get${Capitalize<string & K>}`]: (n: TNode) => ReturnType<T[K]>
} & {
  [K in keyof T as `reset${Capitalize<string & K>}`]: (n: TNode) => void
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
    const sn = {
      ...data,
      [nodeTypeKey]: type,
    } as TNode

    // generate key if missing
    if (nodeTypeObj.key !== undefined) {
      const key = nodeTypeObj.getKey(sn)
      if (key === undefined) {
        ;(sn as any)[nodeTypeObj.key] = getGlobalConfig().keyGenerator()
      }
    }

    return sn
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

  nodeTypeObj.volatile = function <TVolatiles extends Record<string, () => any>>(
    volatiles: TVolatiles
  ) {
    const result = this as any

    for (const volatileKey of Object.keys(volatiles)) {
      const defaultValueGen = volatiles[volatileKey]
      const [getter, setter, resetter] = volatileProp(defaultValueGen)

      const capitalizedVolatileKey = volatileKey.charAt(0).toUpperCase() + volatileKey.slice(1)
      result[`get${capitalizedVolatileKey}`] = getter
      result[`set${capitalizedVolatileKey}`] = setter
      result[`reset${capitalizedVolatileKey}`] = resetter
    }

    return result
  }

  nodeTypeObj.actions = function <TActions extends Record<string, (...args: any) => any>>(
    getActions: (n: TNode) => TActions
  ) {
    const result = this as any

    const cachedActions = new WeakMap<object, TActions>()

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

    return result
  }

  nodeTypeObj.getters = function <TGetters extends Record<string, (...args: any) => any>>(
    getGetters: (n: TNode) => TGetters
  ) {
    const result = this as any

    const cachedGetters = new WeakMap<object, TGetters>()

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

    return result
  }

  nodeTypeObj.computeds = function <TComputeds extends Record<string, ComputedEntry<unknown>>>(
    getComputeds: (n: TNode) => TComputeds
  ) {
    const result = this as any

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

    return result
  }

  registeredNodeTypes.set(type, nodeTypeObj as NodeType<any, any>)

  return nodeTypeObj
}
