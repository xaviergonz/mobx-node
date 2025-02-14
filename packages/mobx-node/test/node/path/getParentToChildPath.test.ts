import { node } from "../../../src"
import { getParentToChildPath } from "../../../src/node/path/getParentToChildPath"

it("should return an empty array when parent and child are the same", () => {
  const root = node({ a: 1 })
  expect(getParentToChildPath(root, root)).toEqual([])
})

it("should return the correct path for a nested child node", () => {
  const root = node({ child: { grandchild: { value: 42 } } })
  const child = root.child
  const grandchild = child.grandchild
  expect(getParentToChildPath(root, grandchild)).toEqual(["child", "grandchild"])
  expect(getParentToChildPath(child, grandchild)).toEqual(["grandchild"])
})

// When the provided child is not actually a descendant of the parent, no path exists so returns undefined.
it("should return undefined when the provided child is not a descendant of the parent", () => {
  const parent = node({ a: 1 })
  const external = node({ b: 2 })
  expect(getParentToChildPath(parent, external)).toBeUndefined()
})
