import { observable, reaction } from "mobx"
import {
  node,
  nodeKey,
  nodeType,
  NodeWithTypeAndKey,
  volatileProp,
  resetVolatileProps,
} from "../../src"

describe("unkeyed volatileprop", () => {
  it("volatileProp get/set", () => {
    const [getVolatile, setVolatile] = volatileProp(() => 100)

    const target1 = observable({})
    expect(getVolatile(target1)).toBe(100)
    setVolatile(target1, 200)
    expect(getVolatile(target1)).toBe(200)

    const target2 = observable({})
    expect(getVolatile(target2)).toBe(100)
    setVolatile(target2, 200)
    expect(getVolatile(target2)).toBe(200)
  })

  it("should trigger mobx reactivity when volatile value is updated", () => {
    const [getVolatile, setVolatile] = volatileProp(() => 0)
    const target = observable({})
    const observedValues: number[] = []

    const disposer = reaction(
      () => getVolatile(target),
      (val) => {
        observedValues.push(val)
      },
      { fireImmediately: true }
    )

    expect(observedValues).toEqual([0])
    setVolatile(target, 5)
    expect(observedValues).toEqual([0, 5])
    disposer()
  })
})

test("resets a single volatile prop to its default value", () => {
  const testObj = observable({})
  const [getVol, setVol, reset] = volatileProp(() => 0)

  expect(getVol(testObj)).toBe(0)

  setVol(testObj, 100)
  expect(getVol(testObj)).toBe(100)

  reset(testObj)
  expect(getVol(testObj)).toBe(0)
})

test("resets multiple volatile props on the same node", () => {
  const testObj = observable({})
  const [getNum, setNum] = volatileProp(() => 10)
  const [getStr, setStr] = volatileProp(() => "default")

  setNum(testObj, 42)
  setStr(testObj, "changed")
  expect(getNum(testObj)).toBe(42)
  expect(getStr(testObj)).toBe("changed")

  resetVolatileProps(testObj)
  expect(getNum(testObj)).toBe(10)
  expect(getStr(testObj)).toBe("default")
})

it("should share volatile state across objects with the same key even if one is unset in the middle", () => {
  const [getVolatile, setVolatile] = volatileProp(() => 0)

  let obj1: NodeWithTypeAndKey | undefined = node({ [nodeType]: "t", [nodeKey]: 1 })

  expect(getVolatile(obj1)).toBe(0)
  setVolatile(obj1, 42)
  expect(getVolatile(obj1)).toBe(42)

  // obj1 "dies"
  obj1 = undefined

  // the state is kept since we did not give time for the finalization registry to kick
  const obj2 = node({ [nodeType]: "t", [nodeKey]: 1 })
  expect(getVolatile(obj2)).toBe(42)
})
