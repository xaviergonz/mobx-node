import { IComputedValueOptions } from "mobx"
import { PrependArgument } from "../../utils/PrependArgument"

/**
 * @internal
 *
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

  /**
   * Generates setter methods for specified properties
   *
   * @param properties - Names of properties to create setters for
   * @returns The same NodeType with added setter methods
   */
  settersFor<K extends keyof TNode & string>(
    ...properties: readonly K[]
  ): BaseNodeType<
    TNode,
    TKey,
    TOther & {
      [P in K as `set${Capitalize<P>}`]: (node: TNode, value: Readonly<TNode[P]>) => void
    }
  >
} & TOther

/**
 * @internal
 *
 * Configuration for a computed property with options
 *
 * @template T - Return type of the computed value
 */
export type ComputedFnWithOptions<T> = { get: () => T } & Omit<
  IComputedValueOptions<T>,
  "get" | "set"
>

/**
 * @internal
 *
 * Computed property definition that can be a function or configuration object
 *
 * @template T - Return type of the computed value
 */
export type ComputedEntry<T> = (() => T) | ComputedFnWithOptions<T>

/**
 * @internal
 *
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
