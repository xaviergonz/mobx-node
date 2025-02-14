import { isChildOfParent, node } from "../../../src"

it("should return true for a direct child", () => {
  const parent = node({ child: { a: 1 } })
  const child = parent.child
  expect(isChildOfParent(child, parent)).toBe(true)
})

it("should return true for a deep descendant", () => {
  const root = node({ child: { grandchild: { a: 1 } } })
  const child = root.child
  const grandchild = child.grandchild
  expect(isChildOfParent(grandchild, root)).toBe(true)
  expect(isChildOfParent(grandchild, child)).toBe(true)
})

it("should return false when the node is not a descendant", () => {
  const parent = node({ a: 1 })
  const external = node({ b: 2 })
  expect(isChildOfParent(external, parent)).toBe(false)
})

it("should return false when parent and child are the same", () => {
  const single = node({ a: 1 })
  expect(isChildOfParent(single, single)).toBe(false)
})
