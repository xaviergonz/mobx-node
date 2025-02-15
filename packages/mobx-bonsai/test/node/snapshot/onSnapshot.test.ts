import { node, onSnapshot } from "../../../src"
import { runInAction } from "mobx"

it("should register snapshots on changes", () => {
  const testNode = node({ a: 1, arr: [] as number[] })
  const snapshots: Array<{ newSn: any; prevSn: any }> = []

  const disposer = onSnapshot(testNode, (newSn, prevSn) => {
    snapshots.push({ newSn, prevSn })
  })

  runInAction(() => {
    testNode.a = 10
  })
  runInAction(() => {
    testNode.arr.push(10)
  })

  expect(snapshots).toMatchInlineSnapshot(`
[
  {
    "newSn": {
      "a": 10,
      "arr": [],
    },
    "prevSn": {
      "a": 1,
      "arr": [],
    },
  },
  {
    "newSn": {
      "a": 10,
      "arr": [
        10,
      ],
    },
    "prevSn": {
      "a": 10,
      "arr": [],
    },
  },
]
`)

  disposer()
})
