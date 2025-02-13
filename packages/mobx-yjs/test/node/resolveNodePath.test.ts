import { node, resolveNodePath } from "../../src"

it("should resolve a nested path in an object node", () => {
  const root = node({ child: { grandchild: { value: 123 } } })
  const resolved = resolveNodePath<{ value: number }>(root, ["child", "grandchild"])
  expect(resolved.value).toBe(123)
})

it("should resolve a nested path in an array node", () => {
  const root = node([{ child: { value: 456 } }])
  const resolved = resolveNodePath<{ value: number }>(root, [0, "child"])
  expect(resolved.value).toBe(456)
})

it("should throw when a path segment does not lead to a node", () => {
  const root = node({ child: 100 })
  expect(() => resolveNodePath(root, ["child"])).toThrow("node expected")
})
