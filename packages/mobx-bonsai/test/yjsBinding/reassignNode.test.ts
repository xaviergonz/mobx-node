import { runInAction, toJS } from "mobx"
import { createObjectTestbed } from "./testbed"

test("reassign an already added object to another part of the tree should fail", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: {
      numberProp: number
    }
    nestedObj2?: {
      numberProp: number
    }
  }>({ nestedObj1: { numberProp: 0 } })
  expect(() => {
    runInAction(() => {
      mobxObservable.nestedObj2 = mobxObservable.nestedObj1
    })
  }).toThrow(
    `The same node cannot appear twice in the same or different trees, trying to assign it to ["nestedObj2"], but it already exists at ["nestedObj1"]`
  )
})

test("reassign an added/removed object to another part of the tree should be ok", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: {
      numberProp: number
    }
    nestedObj2?: {
      numberProp: number
    }
  }>({ nestedObj1: { numberProp: 0 } })
  const mobxNestedObj1 = mobxObservable.nestedObj1
  runInAction(() => {
    mobxObservable.nestedObj1 = undefined
    mobxObservable.nestedObj2 = mobxNestedObj1
  })
  expect(mobxObservable.nestedObj1).toBe(undefined)
  expect(mobxObservable.nestedObj2).toBe(mobxNestedObj1)
})

test("reassign a copy of an added object to another part of the tree should be ok", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: {
      numberProp: number
    }
    nestedObj2?: {
      numberProp: number
    }
  }>({ nestedObj1: { numberProp: 0 } })
  const mobxNestedObj1 = mobxObservable.nestedObj1
  runInAction(() => {
    mobxObservable.nestedObj2 = toJS(mobxNestedObj1)
  })
  expect(mobxObservable.nestedObj1).toBe(mobxNestedObj1)
  expect(mobxObservable.nestedObj2).not.toBe(mobxNestedObj1)
  expect(mobxObservable.nestedObj2).toBeDefined()
})
