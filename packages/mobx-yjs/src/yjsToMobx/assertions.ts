import { isObservableArray, isObservableObject } from "mobx"
import { PlainStructure } from "../types"
import { failure } from "../utils/failure"

export function isObservablePlainStructure(target: unknown): target is PlainStructure {
  return isObservableObject(target) || isObservableArray(target)
}

export function assertIsObservablePlainStructure(
  target: unknown
): asserts target is PlainStructure {
  const valid = isObservablePlainStructure(target)
  if (!valid) {
    throw failure("target is not a bindable mobx observable")
  }
}
