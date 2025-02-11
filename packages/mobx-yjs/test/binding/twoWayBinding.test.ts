import * as Y from "yjs"
import { createArrayTestbed, createObjectTestbed } from "../testbed"
import { runInAction } from "mobx"

test("object two-way binding", () => {
  const { mobxObservable, yjsObject } = createObjectTestbed<{
    numberProp: number
    optionalStrProp?: string
    numberArray: number[]
    nestedObj?: {
      numberProp: number
    }
  }>({ numberProp: 0, numberArray: [1, 2] })
  const yjsMap = yjsObject as Y.Map<any>

  // simple existing prop
  expect(yjsMap.get("numberProp")).toBe(0)
  expect(mobxObservable.numberProp).toBe(0)

  runInAction(() => {
    mobxObservable.numberProp = 10
  })
  expect(yjsMap.get("numberProp")).toBe(10)
  yjsMap.set("numberProp", 20)
  expect(mobxObservable.numberProp).toBe(20)

  // new prop that comes and goes
  expect(yjsMap.get("optionalStrProp")).toBe(undefined)
  expect(mobxObservable.optionalStrProp).toBe(undefined)

  runInAction(() => {
    mobxObservable.optionalStrProp = "hello"
  })
  expect(yjsMap.get("optionalStrProp")).toBe("hello")
  yjsMap.set("optionalStrProp", "world")
  expect(mobxObservable.optionalStrProp).toBe("world")

  runInAction(() => {
    // biome-ignore lint/performance/noDelete: <explanation>
    delete mobxObservable.optionalStrProp
  })
  expect(yjsMap.get("optionalStrProp")).toBe(undefined)
  expect(mobxObservable.optionalStrProp).toBe(undefined)
  expect(yjsMap.has("optionalStrProp")).toBe(false)
  expect("optionalStrProp" in mobxObservable).toBe(false)

  // simple array
  expect(yjsMap.get("numberArray") instanceof Y.Array).toBe(true)
  expect(yjsMap.get("numberArray").toJSON()).toEqual([1, 2])
  expect(mobxObservable.numberArray).toEqual([1, 2])

  runInAction(() => {
    mobxObservable.numberArray.splice(1, 1, 3, 4)
  })
  expect(yjsMap.get("numberArray").toJSON()).toEqual([1, 3, 4])
  ;(yjsMap.get("numberArray") as Y.Array<number>).delete(1, 1)
  expect(mobxObservable.numberArray).toEqual([1, 4])

  // nested object
  expect(yjsMap.get("nestedObj")).toBe(undefined)
  expect(mobxObservable.nestedObj).toBe(undefined)

  runInAction(() => {
    mobxObservable.nestedObj = { numberProp: 100 }
  })
  const nestedObjRef = mobxObservable.nestedObj
  expect(yjsMap.get("nestedObj")).toBeInstanceOf(Y.Map)
  expect(yjsMap.get("nestedObj").get("numberProp")).toBe(100)

  yjsMap.get("nestedObj").set("numberProp", 200)
  expect(mobxObservable.nestedObj).toEqual({ numberProp: 200 })
  expect(mobxObservable.nestedObj).toBe(nestedObjRef)

  yjsMap.set("nestedObj", new Y.Map([["numberProp", 300]]))
  expect(mobxObservable.nestedObj).toEqual({ numberProp: 300 })
  expect(mobxObservable.nestedObj).not.toBe(nestedObjRef)
})

test("array simple two-way binding", () => {
  const { mobxObservable, yjsObject } = createArrayTestbed<number[]>([0])
  const yjsArray = yjsObject as Y.Array<any>

  // initial state
  expect(yjsArray.toJSON()).toEqual([0])
  expect(mobxObservable).toEqual([0])

  // mobx to yjs
  runInAction(() => {
    mobxObservable[0] = 10
    mobxObservable.push(20)
  })
  expect(yjsArray.toJSON()).toEqual([10, 20])

  // yjs to mobx
  yjsArray.push([30])
  expect(mobxObservable).toEqual([10, 20, 30])
})

test("array with nested object two-way binding", () => {
  const { mobxObservable, yjsObject } = createArrayTestbed<{ n: number }[]>([{ n: 0 }])
  const yjsArray = yjsObject as Y.Array<any>

  // initial state
  expect(yjsArray.toJSON()).toEqual([{ n: 0 }])
  expect(mobxObservable).toEqual([{ n: 0 }])

  // mobx to yjs
  runInAction(() => {
    mobxObservable[0].n = 10
    mobxObservable.push({ n: 20 })
  })
  expect(yjsArray.toJSON()).toEqual([{ n: 10 }, { n: 20 }])

  // yjs to mobx
  const newN = new Y.Map()
  newN.set("n", 30)
  yjsArray.push([newN])
  expect(yjsArray.toJSON()).toEqual([{ n: 10 }, { n: 20 }, { n: 30 }])
  expect(mobxObservable).toEqual([{ n: 10 }, { n: 20 }, { n: 30 }])
  newN.set("n", 40)
  expect(mobxObservable).toEqual([{ n: 10 }, { n: 20 }, { n: 40 }])
})
