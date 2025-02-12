import { isComputed, reaction, runInAction } from "mobx"
import { computedProp } from "../../src/utils/computedProp"
import { createObjectTestbed } from "../testbed"

it("computedProp", () => {
  const { mobxObservable: obj } = createObjectTestbed<{
    a: number
  }>({ a: 5 })

  const getDouble = computedProp((o: typeof obj) => [o.a * 2] as const)

  expect(getDouble(obj)).toStrictEqual([10])

  runInAction(() => {
    obj.a = 6
  })
  expect(getDouble(obj)).toStrictEqual([12])

  expect(isComputed(getDouble.getComputedFor(obj))).toBe(true)

  // must be reactive and cached
  const values: (readonly [number])[] = []
  reaction(
    () => getDouble(obj),
    (v) => {
      values.push(v)
    },
    { fireImmediately: true }
  )

  expect(values).toStrictEqual([[12]])
  runInAction(() => {
    obj.a = 5
  })
  expect(values).toStrictEqual([[12], [10]])

  // cached since it is being observed
  const call1 = getDouble(obj)
  const call2 = getDouble(obj)
  expect(call1).toBe(call2)
})
