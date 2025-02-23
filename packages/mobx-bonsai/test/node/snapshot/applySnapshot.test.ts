import { applySnapshot, node, nodeTypeKey, nodeType, TNode } from "../../../src"

test("applies snapshot to an array node", () => {
  const n = node([1, 2, 3])
  const snapshot = [4, 5, 6]
  applySnapshot(n, snapshot)
  expect(n).toStrictEqual(snapshot)
})

test("throws error if snapshot is array but node is not", () => {
  const n = node({ a: 1 })
  const snapshot = [4, 5, 6]
  expect(() => applySnapshot(n, snapshot as any)).toThrow("target must be an array")
})

test("applies snapshot to an observable object with matching type and key", () => {
  type TA = TNode<"A", { id: string; value: number; arr?: number[]; obj?: { a: number } }>
  using tA = nodeType<TA>("A").with({ key: "id" })

  const n = tA({
    id: "1",
    value: 10,
  })

  const snapshot = tA.snapshot({
    id: "1",
    value: 20,
    arr: [1, 2, 3],
    obj: { a: 1 },
  })
  applySnapshot(n, snapshot)
  expect(n).toStrictEqual(snapshot)
})

test("throws error if snapshot changes the type property", () => {
  type TA = TNode<"A", { id: string; value: number }>
  using tA = nodeType<TA>("A").with({ key: "id" })

  type TB = TNode<"B", { id: string; value: number }>
  using tB = nodeType<TB>("B").with({ key: "id" })

  const n = tA({
    id: "1",
    value: 10,
  })
  const snapshot = tB.snapshot({
    // changed type
    id: "1",
    value: 20,
  })
  expect(() => applySnapshot(n, snapshot as any)).toThrow(
    `applySnapshot does not allow changes to the '${nodeTypeKey}' property of the node the snapshot is being applied to`
  )
})

test("throws error if snapshot changes the key property", () => {
  type TA = TNode<"A", { id: string; value: number }>
  using tA = nodeType<TA>("A").with({ key: "id" })

  const n = tA({
    id: "1",
    value: 10,
  })
  const snapshot = tA.snapshot({
    id: "2", // changed key
    value: 20,
  })
  expect(() => applySnapshot(n, snapshot)).toThrow(
    `applySnapshot does not allow changes to the 'id' property of the node the snapshot is being applied to`
  )
})

test("throws error if snapshot is a Map", () => {
  const n = node({})
  const snapshot = new Map()
  expect(() => applySnapshot(n, snapshot as any)).toThrow("must not contain maps")
})

test("throws error if snapshot is a Set", () => {
  const n = node({})
  const snapshot = new Set()
  expect(() => applySnapshot(n, snapshot as any)).toThrow("must not contain sets")
})

test("can swap unique objects around", () => {
  type T1 = TNode<"1", { id: number; n: number }>
  type TestBed = { a?: T1; b?: T1 }

  using t1 = nodeType<T1>("1").with({ key: "id" })

  const initial: TestBed = {
    a: t1.snapshot({ id: 1, n: 0 }),
    b: t1.snapshot({ id: 2, n: 1 }),
  } as const

  const n = node(initial)
  const n1 = n.a!
  const n2 = n.b!

  // swap
  applySnapshot(n, {
    a: initial.b,
    b: initial.a,
  })

  expect(n).toStrictEqual({ a: n2, b: n1 })

  // swap back
  applySnapshot(n, {
    a: initial.a,
    b: initial.b,
  })

  expect(n).toStrictEqual({ a: n1, b: n2 })
})
