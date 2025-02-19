import { observable, reaction } from "mobx"
import { volatileProp } from "../../src"

describe("unkeyed volatileprop", () => {
  it("volatileProp get/set", () => {
    const [getVolatile, setVolatile] = volatileProp(() => 100, undefined)

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
    const [getVolatile, setVolatile] = volatileProp(() => 0, undefined)
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

describe("keyed volatileProp", () => {
  it("should share volatile state across objects with the same key", () => {
    const getKey = (target: { id: number }) => target.id
    const [getVolatile, setVolatile] = volatileProp(() => 0, getKey)

    const obj1 = observable({ id: 1 })
    const obj2 = observable({ id: 1 })

    expect(getVolatile(obj1)).toBe(0)
    expect(getVolatile(obj2)).toBe(0)

    setVolatile(obj1, 42)
    // Shared state update should reflect in both.
    expect(getVolatile(obj1)).toBe(42)
    expect(getVolatile(obj2)).toBe(42)
  })

  it("should share volatile state across objects with the same key even if one is unset in the middle", () => {
    const getKey = (target: { id: number }) => target.id
    const [getVolatile, setVolatile] = volatileProp(() => 0, getKey)

    let obj1: { id: number } | undefined = observable({ id: 1 })

    expect(getVolatile(obj1)).toBe(0)
    setVolatile(obj1, 42)
    expect(getVolatile(obj1)).toBe(42)

    // obj1 "dies"
    obj1 = undefined

    // the state is kept since we did not give time for the finalization registry to kick
    const obj2 = observable({ id: 1 })
    expect(getVolatile(obj2)).toBe(42)
  })

  it("should maintain separate state for objects with different keys", () => {
    const getKey = (target: { id: number }) => target.id
    const [getVolatile, setVolatile] = volatileProp(() => 0, getKey)

    const obj1 = observable({ id: 1 })
    const obj2 = observable({ id: 2 })

    setVolatile(obj1, 42)
    // Only obj1 should be updated.
    expect(getVolatile(obj1)).toBe(42)
    expect(getVolatile(obj2)).toBe(0)
  })
})
