import { runInAction } from "mobx"
import { clone, node, nodeType, TNode } from "../../src"

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

it("should generate new node keys", () => {
  type TType3 = TNode<"type3", { id: string }>
  using tType3 = nodeType<TType3>("type3").with({ key: "id" })

  type TType2 = TNode<"type2", { id: string; c: number }>
  using tType2 = nodeType<TType2>("type2").with({ key: "id" })

  type TType1 = TNode<"type1", { id: string; a: number; b: TType2; arr: TType3[] }>
  using tType1 = nodeType<TType1>("type1").with({ key: "id" })

  const original = tType1({
    id: "key",
    a: 1,
    b: tType2({ id: "key", c: 2 }),
    arr: [tType3({ id: "key" })],
  })
  const cloned = clone(original)

  expect(cloned).not.toBe(original)

  expect(cloned.id).not.toBe(original.id)
  expect(cloned.b.id).not.toBe(original.b.id)
  expect(cloned.arr[0].id).not.toBe(original.arr[0].id)
})
