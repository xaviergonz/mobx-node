import { reaction, runInAction } from "mobx"
import { getParentRef, ParentRef } from "../../src/utils/getParentRef"
import { createObjectTestbed } from "../testbed"

test("simple getParentRef", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: {}
  }>({ nestedObj1: {} })
  expect(getParentRef(mobxObservable)).toStrictEqual({
    parent: undefined,
    parentPath: undefined,
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  const nestedObj1 = mobxObservable.nestedObj1!
  expect(getParentRef(nestedObj1)).toStrictEqual({
    parent: mobxObservable,
    parentPath: "nestedObj1",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  const pathValues: (ParentRef<unknown, unknown> | undefined)[] = []
  const checkPathValues = (expected: (ParentRef<unknown, unknown> | undefined)[]) => {
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
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)
})

test("getParentRef errors", () => {
  expect(() => getParentRef(undefined as any)).toThrow("target is not a bindable mobx observable")
})

test("complex getParentRef", () => {
  const { mobxObservable } = createObjectTestbed<{
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

  expect(getParentRef(mobxObservable.nestedObj1!)).toStrictEqual({
    parent: mobxObservable,
    parentPath: "nestedObj1",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!)).toStrictEqual({
    parent: mobxObservable.nestedObj1,
    parentPath: "nestedObj2",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array)).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2,
    parentPath: "array",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array[0])).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2!.array,
    parentPath: "0",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  expect(getParentRef(mobxObservable.nestedObj1!.nestedObj2!.array[0].nestedObj3!)).toStrictEqual({
    parent: mobxObservable.nestedObj1!.nestedObj2!.array[0],
    parentPath: "nestedObj3",
    root: mobxObservable,
  } satisfies ParentRef<unknown, unknown>)

  // test reactiveness
  const pathValues: (ParentRef<unknown, unknown> | undefined)[] = []
  const checkPathValues = (expected: (ParentRef<unknown, unknown> | undefined)[]) => {
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
