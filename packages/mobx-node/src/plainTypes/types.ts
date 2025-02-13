export type PlainPrimitive = string | number | boolean | null | undefined

export interface PlainObject {
  [key: string]: PlainValue
}

export interface PlainArray extends Array<PlainValue> {}

export type PlainStructure = PlainObject | PlainArray

export type PlainValue = PlainPrimitive | PlainStructure
