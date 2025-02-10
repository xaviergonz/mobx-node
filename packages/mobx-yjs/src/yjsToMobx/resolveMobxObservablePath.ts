import { isObservableArray, isObservableObject } from "mobx"
import { PlainObject, PlainStructure } from "../types"
import { failure } from "../utils/failure"
import { assertIsObservablePlainStructure } from "./assertions"

export function resolveMobxObservablePath(
  mobxObservable: PlainStructure,
  path: readonly (string | number)[]
): PlainStructure {
  let target = mobxObservable
  assertIsObservablePlainStructure(target)

  path.forEach((pathSegment) => {
    if (isObservableArray(target)) {
      target = target[+pathSegment]
      assertIsObservablePlainStructure(target)
    } else if (isObservableObject(target)) {
      target = (target as PlainObject)[pathSegment] as PlainStructure
      assertIsObservablePlainStructure(target)
    } else {
      throw failure("unsupported mobx data structure")
    }
  })

  return target
}
