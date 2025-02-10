import * as Y from "yjs"

export type PlainPrimitive = string | number | boolean | null | undefined

export interface PlainObject {
  [key: string]: PlainValue
}

export interface PlainArray extends Array<PlainValue> {}

export type PlainStructure = PlainObject | PlainArray

export type PlainValue = PlainPrimitive | PlainStructure

export type YjsStructure = Y.Map<YjsValue> | Y.Array<YjsValue>

export type YjsValue = PlainPrimitive | YjsStructure
