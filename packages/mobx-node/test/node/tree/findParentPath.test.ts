import { findParentPath, node } from "../../../src"

it("should find the parent matching the predicate and return the correct path", () => {
  const root = node({ child: { grandchild: { value: 10 } } })
  const grandchild = root.child.grandchild
  const result = findParentPath(grandchild, (p) => p === root)
  expect(result).toBeDefined()
  if (result) {
    expect(result.parent).toBe(root)
    expect(result.path).toEqual(["child", "grandchild"])
  }
})

it("should return undefined if no parent matches the predicate", () => {
  const root = node({ child: { grandchild: { value: 20 } } })
  const grandchild = root.child.grandchild
  // predicate that never matches
  const result = findParentPath(grandchild, () => false)
  expect(result).toBeUndefined()
})

it("should respect maxDepth and return undefined if match is beyond maxDepth", () => {
  const root = node({ child: { grandchild: { value: 30 } } })
  const grandchild = root.child.grandchild
  // Set maxDepth = 1, so only immediate parent is searched (i.e. root.child)
  // In this case, predicate for root won't be reached.
  const result = findParentPath(grandchild, (p) => p === root, 1)
  expect(result).toBeUndefined()
})
