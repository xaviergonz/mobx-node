import { observable } from "mobx"
import * as Y from "yjs"
import { PlainStructure, YjsStructure } from "../types"
import { failure } from "../../utils/failure"

export function createMobxObservableFromYjsObject<T extends PlainStructure>(
  yjsObject: YjsStructure
): T {
  if (yjsObject instanceof Y.Map) {
    return observable.object(yjsObject.toJSON(), {
      deep: true,
    }) as unknown as T
  } else if (yjsObject instanceof Y.Array) {
    return observable.array(yjsObject.toJSON(), { deep: true }) as unknown as T
  } else {
    throw failure("only Y.js Map and Array instances can be bound to MobX")
  }
}
