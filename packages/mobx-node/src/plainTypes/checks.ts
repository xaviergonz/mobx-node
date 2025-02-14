import { isObservableArray, isObservableObject } from "mobx"
import { PlainArray, PlainObject, PlainPrimitive, PlainStructure } from "./types"
import { failure } from "../error/failure"

/**
 * @internal
 */
export function isPlainPrimitive(v: unknown): v is PlainPrimitive {
  const t = typeof v
  return t === "string" || t === "number" || t === "boolean" || v === null || v === undefined
}

/**
 * @internal
 */
export function isPlainArray(v: unknown): v is PlainArray {
  return Array.isArray(v)
}

/**
 * @internal
 */
export function isPlainObject(v: unknown): v is PlainObject {
  return !isPlainArray(v) && typeof v === "object"
}

/**
 * @internal
 */
export function isObservablePlainStructure(target: unknown): target is PlainStructure {
  return isObservableObject(target) || isObservableArray(target)
}

/**
 * @internal
 */
export function assertIsObservablePlainStructure(
  target: unknown,
  argName: string
): asserts target is PlainStructure {
  const valid = isObservablePlainStructure(target)
  if (!valid) {
    throw failure(`${argName} must be an observable object or array`)
  }
}

/**
 * @internal
 */
export function assertIsFunction(value: unknown, argName: string): asserts value is Function {
  if (typeof value !== "function") {
    throw failure(`${argName} must be a function`)
  }
}
