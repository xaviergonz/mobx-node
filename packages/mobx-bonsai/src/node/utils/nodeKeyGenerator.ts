import { nanoid } from "nanoid/non-secure"
import { NodeKeyValue } from "../nodeTypeKey/nodeType"

/**
 * Node key generator function.
 */
export type NodeKeyGenerator = () => NodeKeyValue

let localId = 0
const localBaseId = nanoid()

export const defaultNodeKeyGenerator: NodeKeyGenerator = () => {
  // we use base 36 for local id since it is short and fast
  const id = localId.toString(36) + "-" + localBaseId
  localId++
  return id
}
