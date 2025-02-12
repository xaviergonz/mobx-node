import { reaction, runInAction } from "mobx"
import { ParentRef } from "../../src/bindYjsToMobxObservable"
import { createObjectTestbed } from "../testbed"

test("simple getParentRef", () => {
  const { mobxObservable, getParentRef } = createObjectTestbed<{
    nestedObj1?: {}
  }>({ nestedObj1: {} })
  const nestedObj1 = mobxObservable.nestedObj1!
  expect(getParentRef(nestedObj1)).toStrictEqual({
    parent: mobxObservable,
    parentPath: "nestedObj1",
  } satisfies ParentRef<unknown>)

  const pathValues: (ParentRef<unknown> | undefined)[] = []
  const checkPathValues = (expected: (ParentRef<unknown> | undefined)[]) => {
    expect(pathValues).toStrictEqual(expected)
    pathValues.length = 0
  }

  reaction(
    () => getParentRef(nestedObj1),
    (parent) => {
      pathValues.push(parent)
    }
  )
  checkPathValues([])

  runInAction(() => {
    mobxObservable.nestedObj1 = {}
  })
  checkPathValues([undefined])

  expect(getParentRef(nestedObj1)).toBe(undefined)

  const newNestedObj1 = mobxObservable.nestedObj1!
  expect(getParentRef(newNestedObj1)).toStrictEqual({
    parent: mobxObservable,
    parentPath: "nestedObj1",
  } satisfies ParentRef<unknown>)
})

test("complex getParentRef", () => {
  const { mobxObservable, getParentRef } = createObjectTestbed<{
    nestedObj1?: {
      nestedObj2?: {
        array: {
          nestedObj3?: {
            numberProp: number
          }
        }[]
      }
    }
  }>({ nestedObj1: { nestedObj2: { array: [{ nestedObj3: { numberProp: 0 } }] } } })
  expect(() => getParentRef(undefined as any)).toThrow("target is not a bindable mobx observable")

  expect(getParentRef(mobxObservable)).toBe(undefined)

  expect(getParentRef(mobxObservable.nestedObj1!)).toStrictEqual({
    parent: mobxObservable,
    parentPath: "nestedObj1",
  } satisfies ParentRef<unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!)).toStrictEqual({
    parent: mobxObservable.nestedObj1,
    parentPath: "nestedObj2",
  } satisfies ParentRef<unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array)).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2,
    parentPath: "array",
  } satisfies ParentRef<unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array[0])).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2!.array,
    parentPath: "0",
  } satisfies ParentRef<unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array[0].nestedObj3!)).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2!.array[0],
    parentPath: "nestedObj3",
  } satisfies ParentRef<unknown>)

  // test reactiveness
  const pathValues: (ParentRef<unknown> | undefined)[] = []
  const checkPathValues = (expected: (ParentRef<unknown> | undefined)[]) => {
    expect(pathValues).toStrictEqual(expected)
    pathValues.length = 0
  }

  const nestedObj3 = mobxObservable.nestedObj1!.nestedObj2!.array[0].nestedObj3!
  reaction(
    () => getParentRef(nestedObj3),
    (parent) => {
      pathValues.push(parent)
    }
  )
  checkPathValues([])

  runInAction(() => {
    mobxObservable.nestedObj1!.nestedObj2!.array[0].nestedObj3!.numberProp = 1
  })
  checkPathValues([])

  runInAction(() => {
    mobxObservable.nestedObj1!.nestedObj2!.array.length = 0
  })
  checkPathValues([undefined])
})
