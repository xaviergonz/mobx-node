import * as Y from "yjs"
import { node } from "../../src"
import { createObjectTestbed } from "./testbed"

it("should resolve a nodes to Y.js structures", () => {
  const { mobxObservable, getYjsObjectForNode, yjsObject } = createObjectTestbed({
    childMap: { sub: {} },
    childArray: [{}],
  })
  expect(getYjsObjectForNode(mobxObservable)).toBe(yjsObject)

  expect(getYjsObjectForNode(mobxObservable.childMap)).toBe(yjsObject.get("childMap"))
  expect(getYjsObjectForNode(mobxObservable.childMap.sub)).toBe(
    (yjsObject.get("childMap") as Y.Map<any>).get("sub")
  )

  expect(getYjsObjectForNode(mobxObservable.childArray)).toBe(yjsObject.get("childArray"))
  expect(getYjsObjectForNode(mobxObservable.childArray[0])).toBe(
    (yjsObject.get("childArray") as Y.Array<any>).get(0)
  )
})

it("should throw when the target node is not in the bound tree", () => {
  const { getYjsObjectForNode } = createObjectTestbed({
    childMap: {},
    childArray: [],
  })
  const unknownNode = node({})

  expect(() => getYjsObjectForNode(unknownNode)).toThrow("node not found in the bound tree")
})
