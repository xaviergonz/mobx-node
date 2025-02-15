import { node, resolvePath } from "../../../src"

it("should resolve a nested path in an object node", () => {
  const root = node({ child: { grandchild: { value: 123 } } })
  const resolved = resolvePath<{ value: number }>(root, ["child", "grandchild"])
  expect(resolved.resolved).toBe(true)
  expect(resolved.value!.value).toBe(123)
})

it("should resolve a nested path in an array node", () => {
  const root = node([{ child: { value: 456 } }])
  const resolved = resolvePath<{ value: number }>(root, ["0", "child"])
  expect(resolved.resolved).toBe(true)
  expect(resolved.value!.value).toBe(456)
})

it("should return unresolved when a path segment does not exist", () => {
  const root = node({ child: 100 })
  const resolved = resolvePath(root, ["child2"])
  expect(resolved.resolved).toBe(false)
})
