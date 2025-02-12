import * as Y from "yjs"
import { PlainArray, PlainObject, PlainValue } from "../../plainTypes/types"
import { failure } from "../../utils/failure"
import { YjsValue } from "src/yjsTypes/types"
import { isPlainArray, isPlainObject, isPlainPrimitive } from "../../plainTypes/assertions"

/**
 * Converts a plain value to a Y.js value.
 * Objects are converted to Y.Maps, arrays to Y.Arrays, primitives are untouched.
 */
export function convertPlainToYjsValue(v: PlainValue): YjsValue {
  if (isPlainPrimitive(v)) {
    return v
  }

  if (isPlainArray(v)) {
    const arr = new Y.Array<YjsValue>()
    applyPlainArrayToYArray(arr, v)
    return arr as YjsValue
  }

  if (isPlainObject(v)) {
    const map = new Y.Map<YjsValue>()
    applyPlainObjectToYMap(map, v)
    return map as YjsValue
  }

  throw failure(`unsupported value type: ${v}`)
}

/**
 * Applies a plain array to a Y.Array, using the convertPlainToYjsValue to convert the values.
 */
export function applyPlainArrayToYArray(dest: Y.Array<YjsValue>, source: PlainArray) {
  dest.push(source.map(convertPlainToYjsValue))
}

/**
 * Applies a plain object to a Y.Map, using the convertPlainToYjsValue to convert the values.
 */
export function applyPlainObjectToYMap(dest: Y.Map<YjsValue>, source: PlainObject) {
  Object.entries(source).forEach(([k, v]) => {
    dest.set(k, convertPlainToYjsValue(v))
  })
}
