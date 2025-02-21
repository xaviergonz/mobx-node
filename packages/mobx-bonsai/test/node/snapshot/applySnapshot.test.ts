import { applySnapshot, node, nodeKey, nodeType, NodeWithTypeAndKey } from "../../../src"

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
  const n = node({
    [nodeType]: "A",
    [nodeKey]: "1",
    value: 10,
  })

  const snapshot = {
    [nodeType]: "A",
    [nodeKey]: "1",
    value: 20,
    arr: [1, 2, 3],
    obj: { a: 1 },
  }
  applySnapshot(n, snapshot)
  expect(n).toStrictEqual(snapshot)
})

test("throws error if snapshot changes the type property", () => {
  const n = node({
    [nodeType]: "A",
    [nodeKey]: "1",
    value: 10,
  })
  const snapshot = {
    [nodeType]: "B", // changed type
    [nodeKey]: "1",
    value: 20,
  }
  expect(() => applySnapshot(n, snapshot)).toThrow(
    `applySnapshot does not allow changes to the ${nodeType} property of the node the snapshot is being applied to`
  )
})

test("throws error if snapshot changes the key property", () => {
  const n = node({
    [nodeType]: "A",
    [nodeKey]: "1",
    value: 10,
  })
  const snapshot = {
    [nodeType]: "A",
    [nodeKey]: "2", // changed key
    value: 20,
  }
  expect(() => applySnapshot(n, snapshot)).toThrow(
    `applySnapshot does not allow changes to the ${nodeKey} property of the node the snapshot is being applied to`
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
  type Obj = NodeWithTypeAndKey & { n: number }
  type TestBed = { a?: Obj; b?: Obj }

  const initial: TestBed = {
    a: { [nodeType]: "1", [nodeKey]: 1, n: 0 },
    b: { [nodeType]: "1", [nodeKey]: 2, n: 1 },
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
