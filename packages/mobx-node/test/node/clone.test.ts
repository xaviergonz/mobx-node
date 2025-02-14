import { runInAction } from "mobx"
import { clone, node } from "../../src"

it("should create a clone that is deeply equal but not the same reference", () => {
  const original = node({ a: 1, b: { c: 2 } })
  const cloned = clone(original)
  expect(cloned).not.toBe(original)
  expect(cloned).toEqual(original)
})

it("modifying the clone should not affect the original", () => {
  const original = node({ a: 1, b: { c: 2 } })
  const cloned = clone(original)
  runInAction(() => {
    cloned.b.c = 999
  })
  expect(original.b.c).toBe(2)
  expect(cloned.b.c).toBe(999)
})

it("modifying the original should not affect the clone", () => {
  const original = node({ a: 1, b: { c: 2 } })
  const cloned = clone(original)
  runInAction(() => {
    original.a = 42
  })
  expect(original.a).toBe(42)
  expect(cloned.a).toBe(1)
})
