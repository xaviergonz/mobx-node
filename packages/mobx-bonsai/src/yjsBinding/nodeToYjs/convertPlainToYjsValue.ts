import { action, isObservableArray, isObservableObject, runInAction } from "mobx"
import * as Y from "yjs"
import { failure } from "../../error/failure"
import { isPlainObject, isPrimitive } from "../../plainTypes/checks"
import { Primitive } from "../../plainTypes/types"
import { YjsValue } from "../yjsTypes/types"

/**
 * Converts a plain value to a Y.js value.
 * Objects are converted to Y.Maps, arrays to Y.Arrays, primitives are untouched.
 */
export function convertPlainToYjsValue<T extends Primitive>(v: T): T
export function convertPlainToYjsValue(v: readonly any[]): Y.Array<YjsValue>
export function convertPlainToYjsValue(v: Readonly<Record<string, any>>): Y.Map<YjsValue>

export function convertPlainToYjsValue(v: any): YjsValue {
  return runInAction(() => {
    if (isPrimitive(v)) {
      return v
    }

    if (Array.isArray(v) || isObservableArray(v)) {
      const arr = new Y.Array<YjsValue>()
      applyPlainArrayToYArray(arr, v)
      return arr as YjsValue
    }

    if (isPlainObject(v) || isObservableObject(v)) {
      const map = new Y.Map<YjsValue>()
      applyPlainObjectToYMap(map, v)
      return map as YjsValue
    }

    throw failure(`unsupported value type: ${v}`)
  })
}

/**
 * Applies a plain array to a Y.Array, using the convertPlainToYjsValue to convert the values.
 */
export const applyPlainArrayToYArray = action((dest: Y.Array<any>, source: readonly any[]) => {
  dest.push(source.map(convertPlainToYjsValue))
})

/**
 * Applies a plain object to a Y.Map, using the convertPlainToYjsValue to convert the values.
 */
export const applyPlainObjectToYMap = action(
  (dest: Y.Map<any>, source: Readonly<Record<string, any>>) => {
    Object.entries(source).forEach(([k, v]) => {
      dest.set(k, convertPlainToYjsValue(v))
    })
  }
)
