import { failure } from "../error/failure"
import { getGlobalConfig } from "../globalConfig"
import { isPlainObject, isPrimitive } from "../plainTypes/checks"
import { node } from "./node"
import { getNodeTypeAndKey } from "./nodeTypeKey"
import { getSnapshot } from "./snapshot/getSnapshot"

function deepSubstituteNodeKeys<T>(value: T): T {
  if (isPrimitive(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((v) => deepSubstituteNodeKeys(v)) as T
  }

  if (isPlainObject(value)) {
    const typeAndKey = getNodeTypeAndKey(value)
    const keyProp = typeAndKey.type && "key" in typeAndKey.type ? typeAndKey.type.key : undefined

    const newValue: any = {}
    for (const key in value) {
      if (key === keyProp) {
        newValue[key] = getGlobalConfig().keyGenerator()
      } else {
        newValue[key] = deepSubstituteNodeKeys(value[key])
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
 * @returns The cloned node.
 */
export function clone<T extends object>(nodeToClone: T): T {
  const snapshotWithChangedKeys = deepSubstituteNodeKeys(getSnapshot(nodeToClone))

  return node(snapshotWithChangedKeys)
}
