import {
  isObservableArray,
  isObservableMap,
  isObservableObject,
  isObservableSet,
  ObservableMap,
  ObservableSet,
} from "mobx"
import { Primitive } from "./types"
import { failure } from "../error/failure"

/**
 * @internal
 */
export function isPrimitive(v: unknown): v is Primitive {
  const t = typeof v
  return t === "string" || t === "number" || t === "boolean" || v === null || v === undefined
}

/**
 * @internal
 */
export function isPlainObject(v: unknown): v is Record<string, any> {
  return v !== null && typeof v === "object" && v.constructor === Object
}

/**
 * @internal
 */
export function isArray(v: unknown): v is any[] {
  return Array.isArray(v) || isObservableArray(v)
}

/**
 * @internal
 */
export function isMap(val: unknown): val is Map<any, any> | ObservableMap {
  return val instanceof Map || isObservableMap(val)
}

/**
 * @internal
 */
export function isSet(val: unknown): val is Set<any> | ObservableSet {
  return val instanceof Set || isObservableSet(val)
}

/**
 * @internal
 */
export function isObservablePlainStructure(target: unknown): boolean {
  return isObservableObject(target) || isObservableArray(target)
}

/**
 * @internal
 */
export function assertIsObservablePlainStructure(target: unknown, argName: string): void {
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
