import * as Y from "yjs"
import { failure } from "../../error/failure"
import { node } from "../../node/node"
import { YjsStructure } from "../yjsTypes/types"

export function createMobxNodeFromYjsObject<T = unknown>(yjsObject: YjsStructure): T {
  if (yjsObject instanceof Y.Map || yjsObject instanceof Y.Array) {
    return node(yjsObject.toJSON()) as unknown as T
  } else {
    throw failure("only Y.js Map and Array instances can be bound to MobX nodes")
  }
}
