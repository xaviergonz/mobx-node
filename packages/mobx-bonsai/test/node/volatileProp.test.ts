import { observable, reaction } from "mobx"
import { volatileProp } from "../../src"

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
