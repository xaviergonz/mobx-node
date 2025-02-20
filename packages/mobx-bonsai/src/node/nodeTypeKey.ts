import { assertIsNode } from "./node"

export const nodeType = "$$type"
export type NodeType = string | number

export const nodeKey = "$$key"
export type NodeKey = string | number

interface NodeTypeAndKey {
  readonly [nodeType]: NodeType | undefined
  readonly [nodeKey]: NodeKey | undefined
}

export interface UniqueNodeTypeAndKey {
  readonly [nodeType]: NodeType
  readonly [nodeKey]: NodeKey
}

const nodeByTypeAndKey = new Map<NodeType, Map<NodeKey, WeakRef<object>>>()

const finalizationRegistry = new FinalizationRegistry((typeKey: UniqueNodeTypeAndKey) => {
  const typeMap = nodeByTypeAndKey.get(typeKey[nodeType])
  if (!typeMap) {
    // already gone
    return
  }

  const ref = typeMap.get(typeKey[nodeKey])
  if (!ref) {
    // already gone
    return
  }

  if (ref.deref()) {
    // still alive
    return
  }

  // dead and should be removed
  typeMap.delete(typeKey[nodeKey])
  if (typeMap.size === 0) {
    nodeByTypeAndKey.delete(typeKey[nodeType])
  }
})

/**
 * Retrieves the unique node that matches { $$type: type, $$key: key }.
 *
 * @param type The type of the node.
 * @param key The unique key of the node for that type.
 * @returns The node if found, otherwise undefined.
 */
export function getNodeByTypeAndKey(type: NodeType, key: NodeKey): object | undefined {
  const typeMap = nodeByTypeAndKey.get(type)
  if (!typeMap) {
    return undefined
  }

  const ref = typeMap.get(key)

  return ref?.deref()
}

/**
 * @internal
 */
export function tryRegisterNodeByTypeAndKey(node: object): boolean {
  assertIsNode(node, "node")
  const typeKey = extractNodeTypeAndKey(node)

  if (!isUniqueNodeTypeAndKey(typeKey)) {
    return false
  }

  const { [nodeType]: type, [nodeKey]: key } = typeKey

  let typeMap = nodeByTypeAndKey.get(type)
  if (!typeMap) {
    typeMap = new Map()
    nodeByTypeAndKey.set(type, typeMap)
  }

  typeMap.set(key, new WeakRef(node))
  finalizationRegistry.register(node, typeKey)

  return true
}

/**
 * @internal
 */
export function extractNodeTypeAndKey(node: object): NodeTypeAndKey {
  const type = (node as any)[nodeType]
  const key = (node as any)[nodeKey]

  return { [nodeType]: type, [nodeKey]: key }
}

/**
 * @internal
 */
export function isUniqueNodeTypeAndKey(
  nodeTypeKey: NodeTypeAndKey
): nodeTypeKey is UniqueNodeTypeAndKey {
  const typeKey = extractNodeTypeAndKey(nodeTypeKey)
  return typeKey[nodeType] !== undefined && typeKey[nodeKey] !== undefined
}
