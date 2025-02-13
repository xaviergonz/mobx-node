import { isObservableArray, isObservableObject } from "mobx"
import { PlainArray, PlainObject, PlainPrimitive, PlainStructure } from "./types"
import { failure } from "../error/failure"

export function isPlainPrimitive(v: unknown): v is PlainPrimitive {
  const t = typeof v
  return t === "string" || t === "number" || t === "boolean" || v === null || v === undefined
}

export function isPlainArray(v: unknown): v is PlainArray {
  return Array.isArray(v)
}

export function isPlainObject(v: unknown): v is PlainObject {
  return !isPlainArray(v) && typeof v === "object"
}

export function isObservablePlainStructure(target: unknown): target is PlainStructure {
  return isObservableObject(target) || isObservableArray(target)
}

export function assertIsObservablePlainStructure(
  target: unknown
): asserts target is PlainStructure {
  const valid = isObservablePlainStructure(target)
  if (!valid) {
    throw failure("target is not an observable object or array")
  }
}
