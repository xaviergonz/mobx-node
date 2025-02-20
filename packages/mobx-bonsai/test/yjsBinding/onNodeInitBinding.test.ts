import { runInAction } from "mobx"
import * as Y from "yjs"
import { nodeType, onNodeInit } from "../../src"
import { createObjectTestbed } from "./testbed"

test("should update underlying Y.js structure when onNodeInit increases counter", () => {
  onNodeInit("0", (node: any) => {
    node.counter += 1
  })

  const { mobxObservable, yjsObject } = createObjectTestbed<{
    [nodeType]: "0"
    counter: number
    child?: {
      [nodeType]: "0"
      counter: number
    }
  }>({
    [nodeType]: "0",
    counter: 0,
  })

  const yjsMap = yjsObject as Y.Map<any>
  expect(mobxObservable.counter).toBe(1)
  expect(yjsMap.get("counter")).toBe(1)

  runInAction(() => {
    mobxObservable.child = { [nodeType]: "0", counter: 1 }
  })
  expect(mobxObservable.child!.counter).toBe(2)
  expect(yjsMap.get("child")!.get("counter")).toBe(2)
})
