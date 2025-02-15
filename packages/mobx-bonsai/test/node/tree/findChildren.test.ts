import { node, findChildren } from "../../../src"

it("should return matching children for a shallow search in an object node", () => {
  const parent = node({
    child1: { a: 1 },
    child2: { b: 2 },
    nonMatching: { c: 3 },
  })
  const result = findChildren(parent, (child) => "a" in child)
  // Only child1 has property 'a'
  expect(result.size).toBe(1)
  expect(result.has(parent.child1)).toBe(true)
})

it("should return matching children for a deep search in a nested object node", () => {
  const parent = node({
    child1: { a: 1 },
    child2: { b: 2, nested: { a: 2, d: 4 } },
    nonMatching: { c: 3 },
  })
  // Shallow search: only child1 and child2 are considered;
  const shallowResult = findChildren(parent, (child) => "a" in child, {
    deep: false,
  })
  expect(shallowResult.size).toBe(1)
  expect(shallowResult.has(parent.child1)).toBe(true)

  // Deep search: nested node in child2 matches as well.
  const deepResult = findChildren(parent, (child) => "a" in child, { deep: true })
  expect(deepResult.size).toBe(2)
  expect(deepResult.has(parent.child1)).toBe(true)
  expect(deepResult.has(parent.child2.nested)).toBe(true)
})

it("should return matching children for an array node", () => {
  const arr = node([{ a: 1 }, { b: 2 }, { a: 3 }])
  const result = findChildren(arr, (child) => "a" in child)
  // Two elements with property 'a'
  expect(result.size).toBe(2)
  expect(result.has(arr[0])).toBe(true)
  expect(result.has(arr[2])).toBe(true)
})
