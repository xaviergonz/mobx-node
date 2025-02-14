import * as Y from "yjs"
import { failure } from "../../error/failure"
import { MobxNode, node } from "../../node/node"
import { YjsStructure } from "../yjsTypes/types"

/**
 * @internal
 */
export function createMobxNodeFromYjsObject<T extends MobxNode>(yjsObject: YjsStructure): T {
  if (yjsObject instanceof Y.Map || yjsObject instanceof Y.Array) {
    return node(yjsObject.toJSON()) as unknown as T
  } else {
    throw failure("only Y.js Map and Array instances can be bound to MobX nodes")
  }
}
