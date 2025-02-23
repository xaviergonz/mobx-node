import { failure } from "../error/failure"
import { isPlainObject, isPrimitive } from "../plainTypes/checks"
import { node } from "./node"
import { getNodeTypeAndKey } from "./nodeTypeKey"
import { getSnapshot } from "./snapshot/getSnapshot"
import { NodeKeyGenerator, defaultNodeKeyGenerator } from "./utils/nodeKeyGenerator"

function deepSubstituteNodeKeys<T>(value: T, nodeKeyGenerator: NodeKeyGenerator): T {
  if (isPrimitive(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((v) => deepSubstituteNodeKeys(v, nodeKeyGenerator)) as T
  }

  if (isPlainObject(value)) {
    const typeAndKey = getNodeTypeAndKey(value)
    const keyProp = typeAndKey.type?.key

    const newValue: any = {}
    for (const key in value) {
      if (key === keyProp) {
        newValue[key] = nodeKeyGenerator()
      } else {
        newValue[key] = deepSubstituteNodeKeys(value[key], nodeKeyGenerator)
      }
    }
    return newValue
  }

  throw failure("unsupported value type")
}

/**
 * Clones a node. It will generate new node keys deeply.
 *
 * @param nodeToClone Node to clone.
 * @param nodeKeyGenerator Optional node key generator.
 * @returns The cloned node.
 */
export function clone<T extends object>(
  nodeToClone: T,
  nodeKeyGenerator = defaultNodeKeyGenerator
): T {
  const snapshotWithChangedKeys = deepSubstituteNodeKeys(getSnapshot(nodeToClone), nodeKeyGenerator)

  return node(snapshotWithChangedKeys)
}
