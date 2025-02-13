import { reaction, runInAction } from "mobx"
import { getSnapshot } from "../../src/utils/getSnapshot"
import { createObjectTestbed } from "../testbed"

it("throws if an unsupported type is passed", () => {
  expect(() => getSnapshot(undefined as any)).toThrow("target is not an observable object or array")
})

it("referencial integrity", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: { n: number }
    number: number
  }>({ nestedObj1: { n: 0 }, number: 1 })

  const rootSn = getSnapshot(mobxObservable)
  expect(rootSn).toMatchInlineSnapshot(`
{
  "nestedObj1": {
    "n": 0,
  },
  "number": 1,
}
`)
  // no changes should result in the same snapshot
  expect(getSnapshot(mobxObservable)).toBe(rootSn)

  const nestedObj1Sn = getSnapshot(mobxObservable.nestedObj1!)
  expect(nestedObj1Sn).toMatchInlineSnapshot(`
{
  "n": 0,
}
`)
  expect(rootSn?.nestedObj1).toBe(nestedObj1Sn)
  // no changes should result in the same snapshot
  expect(getSnapshot(mobxObservable.nestedObj1!)).toBe(nestedObj1Sn)

  // change child
  runInAction(() => {
    mobxObservable.nestedObj1!.n++
  })
  // nestedObj1Sn should have changed
  const newNestedObj1Sn = getSnapshot(mobxObservable.nestedObj1!)
  expect(newNestedObj1Sn).toMatchInlineSnapshot(`
{
  "n": 1,
}
`)
  expect(newNestedObj1Sn).not.toBe(nestedObj1Sn)

  // rootSn should have changed
  const newRootSn = getSnapshot(mobxObservable)
  expect(newRootSn).toMatchInlineSnapshot(`
{
  "nestedObj1": {
    "n": 1,
  },
  "number": 1,
}
`)
  expect(newRootSn).not.toBe(rootSn)
  expect(newRootSn?.nestedObj1).toBe(newNestedObj1Sn)

  // change root
  runInAction(() => {
    mobxObservable.number++
  })
  // rootSn should have changed
  const newRootSn2 = getSnapshot(mobxObservable)
  expect(newRootSn2).toMatchInlineSnapshot(`
{
  "nestedObj1": {
    "n": 1,
  },
  "number": 2,
}
`)
  expect(newRootSn2).not.toBe(newRootSn)

  // nestedObj1Sn should NOT have changed
  expect(newRootSn2!.nestedObj1).toBe(newNestedObj1Sn)
  expect(getSnapshot(mobxObservable.nestedObj1!)).toBe(newNestedObj1Sn)

  // detach child
  const oldNestedObj1 = mobxObservable.nestedObj1!
  runInAction(() => {
    mobxObservable.nestedObj1 = undefined
  })

  // detached, so should be undefined
  expect(getSnapshot(oldNestedObj1)).toBe(undefined)

  // rootSn should have changed
  const newRootSn3 = getSnapshot(mobxObservable)
  expect(newRootSn3).toMatchInlineSnapshot(`
{
  "nestedObj1": undefined,
  "number": 2,
}
`)
  expect(newRootSn3).not.toBe(newRootSn2)

  // reattach child
  runInAction(() => {
    mobxObservable.nestedObj1 = oldNestedObj1
  })

  // nestedObj1Sn should have changed
  const newNestedObj1Sn2 = getSnapshot(mobxObservable.nestedObj1!)
  expect(newNestedObj1Sn2).toMatchInlineSnapshot(`
{
  "n": 1,
}
`)
  expect(newNestedObj1Sn2).not.toBe(newNestedObj1Sn)

  // rootSn should have changed
  const newRootSn4 = getSnapshot(mobxObservable)
  expect(newRootSn4).toMatchInlineSnapshot(`
{
  "nestedObj1": {
    "n": 1,
  },
  "number": 2,
}
`)
  expect(newRootSn4).not.toBe(newRootSn3)
  expect(newRootSn4!.nestedObj1).toBe(newNestedObj1Sn2)
})

it("should trigger mobx reactions when snapshots change", () => {
  const { mobxObservable } = createObjectTestbed<{
    nestedObj1?: { n: number }
    number: number
  }>({ nestedObj1: { n: 0 }, number: 1 })

  const snapshots: any[] = []
  reaction(
    () => getSnapshot(mobxObservable),
    (snapshot) => {
      snapshots.push({ rootSn: snapshot })
    }
  )
  const nestedObj1 = mobxObservable.nestedObj1!
  reaction(
    () => getSnapshot(nestedObj1),
    (snapshot) => {
      snapshots.push({ nestedObj1Sn: snapshot })
    }
  )

  // change child
  runInAction(() => {
    nestedObj1.n++
  })
  expect(snapshots).toMatchInlineSnapshot(`
[
  {
    "rootSn": {
      "nestedObj1": {
        "n": 1,
      },
      "number": 1,
    },
  },
  {
    "nestedObj1Sn": {
      "n": 1,
    },
  },
]
`)
  snapshots.length = 0

  // change root
  runInAction(() => {
    mobxObservable.number++
  })
  expect(snapshots).toMatchInlineSnapshot(`
[
  {
    "rootSn": {
      "nestedObj1": {
        "n": 1,
      },
      "number": 2,
    },
  },
]
`)
  snapshots.length = 0

  // detach child
  runInAction(() => {
    mobxObservable.nestedObj1 = undefined
  })
  expect(snapshots).toMatchInlineSnapshot(`
[
  {
    "rootSn": {
      "nestedObj1": undefined,
      "number": 2,
    },
  },
  {
    "nestedObj1Sn": undefined,
  },
]
`)
  snapshots.length = 0

  // reattach child
  runInAction(() => {
    mobxObservable.nestedObj1 = nestedObj1
  })
  expect(snapshots).toMatchInlineSnapshot(`
[
  {
    "rootSn": {
      "nestedObj1": {
        "n": 1,
      },
      "number": 2,
    },
  },
  {
    "nestedObj1Sn": {
      "n": 1,
    },
  },
]
`)
  snapshots.length = 0
})
