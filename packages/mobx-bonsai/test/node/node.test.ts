import { configure, isObservable, observable, reaction, runInAction } from "mobx"
import { node, isNode, getSnapshot } from "../../src"
import { nodeKey, nodeType } from "../../src/node/nodeTypeKey"

it("should convert a plain object into a node", () => {
  const obj = { a: 1, b: { c: 2 } }
  expect(isNode(obj)).toBe(false)

  const nObj = node(obj)
  expect(isNode(nObj)).toBe(true)
})

it("should automatically convert nested objects into nodes", () => {
  const obj = { a: 1, b: { c: 2 } }
  const nObj = node(obj)
  // Nested object b should be converted to a node
  expect(isNode(nObj.b)).toBe(true)
})

it("should return the same instance when the object is already a node", () => {
  const obj = { a: 1 }
  const nObj = node(obj)
  expect(node(nObj)).toBe(nObj)
})

it("an observable should keep the same ref when converted to a node", () => {
  const obj = observable({ a: 1 }, undefined, { deep: true })
  const nObj = node(obj)
  expect(node(nObj)).toBe(nObj)
})

it("should handle arrays and convert their items to nodes", () => {
  const arr = [{ value: 1 }, { value: 2 }]
  expect(isNode(arr)).toBe(false)

  const nArr = node(arr)
  expect(isNode(nArr)).toBe(true)
  nArr.forEach((item) => {
    expect(isNode(item)).toBe(true)
  })
})

it("should keep a detached child as a node, should keep the same reference when reattaching a child node", () => {
  const parent = node({ child: { x: 42 } } as { child?: { x: number } })
  const detachedChild = parent.child!
  runInAction(() => {
    parent.child = undefined
  })
  expect(isNode(detachedChild)).toBe(true)
  const parent2 = node({ child: {} })
  runInAction(() => {
    parent2.child = detachedChild // reattach
  })
  expect(parent2.child).toBe(detachedChild)
})

it("should convert a plain object assigned as a child into a node (changing the reference)", () => {
  const parent = node({} as { child?: { y: number } })
  const plainChild = { y: 100 }
  runInAction(() => {
    parent.child = plainChild // assign a plain object
  })
  expect(isObservable(parent.child!)).toBe(true)
  expect(isNode(parent.child!)).toBe(true)
  expect(parent.child).not.toBe(plainChild)
})

it("should return the same node when the same type and key are used", () => {
  const obj1 = { [nodeType]: "type", [nodeKey]: "key" }
  const nObj1 = node(obj1)
  expect(node(obj1)).toBe(nObj1)

  // different key
  const obj2 = { [nodeType]: "type2", [nodeKey]: "key2" }
  const nObj2 = node(obj2)
  expect(node({ [nodeType]: "type2", [nodeKey]: "key3" })).not.toBe(nObj2)

  // different type
  const obj3 = { [nodeType]: "type3", [nodeKey]: "key" }
  const nObj3 = node({ [nodeType]: "type4", [nodeKey]: "key" })
  expect(node(obj3)).not.toBe(nObj3)
})

it("unique node reconciliation", () => {
  const nObj1 = node({
    [nodeType]: "t",
    [nodeKey]: "key",
    a: 1,
    b: { c: 1 },
    arr: [{ d: 1 }],
    arr2: [{ d: 1 }, { d: 1 }],
    uni: {
      [nodeType]: "t2",
      [nodeKey]: "key",
      a: 1,
    },
  })
  const arr = nObj1.arr
  const uni1 = nObj1.uni

  const obj2 = {
    [nodeType]: "t",
    [nodeKey]: "key",
    a: 2,
    b: { c: 2 },
    d: 2, // new prop
    arr: [
      { d: 2 },
      { d: 3 }, // new item
    ],
    arr2: [
      // one less item
      { d: 2 },
    ],
    uni: {
      [nodeType]: "t2",
      [nodeKey]: "key",
      a: 2,
    },
  }
  const nObj2 = node(obj2)

  expect(nObj2).toBe(nObj1)
  expect(nObj2.arr).toBe(arr)
  expect(nObj2.arr[0]).toBe(arr[0])
  expect(nObj2.uni).toBe(uni1)

  expect(getSnapshot(nObj2)).toStrictEqual(obj2)
})

it("swapping a node in an array should be ok if we reconciliate", () => {
  const nObj1 = node([
    {
      [nodeType]: "a",
      [nodeKey]: "1",
      a: 1,
    },
    {
      [nodeType]: "a",
      [nodeKey]: "2",
      a: 2,
    },
  ])
  const n1 = nObj1[0]
  const n2 = nObj1[1]

  const nObj2 = node([
    {
      [nodeType]: "a",
      [nodeKey]: "2",
      a: 3,
    },
    {
      [nodeType]: "a",
      [nodeKey]: "1",
      a: 4,
    },
  ])

  expect(nObj2).not.toBe(nObj1)
  expect(nObj2[0]).toBe(n2)
  expect(nObj2[1]).toBe(n1)
  expect(n2.a).toBe(3)
  expect(n1.a).toBe(4)
})

it("adding a plain object to an object should be a node", () => {
  const nObj = node<{ child?: { a: number } }>({})
  runInAction(() => {
    nObj.child = { a: 1 }
  })
  expect(isNode(nObj.child!)).toBe(true)
})

it("adding a plain object to an array should be a node", () => {
  const nArr = node<{ a: number }[]>([])
  runInAction(() => {
    nArr.push({ a: 1 })
  })
  expect(isNode(nArr[0])).toBe(true)

  runInAction(() => {
    nArr[1] = { a: 1 }
  })
  expect(isNode(nArr[1])).toBe(true)
})

it("setting a plain value of an existing unique node should result in a single reaction", () => {
  configure({ enforceActions: "never" })
  try {
    const nodeData1 = {
      [nodeType]: "a2",
      [nodeKey]: "1",
      a: 1,
    }
    const nObj1 = node(nodeData1)

    const nodeData2 = {
      [nodeType]: "a2",
      [nodeKey]: "2",
      a: 2,
    }
    node(nodeData2)

    const nParent = node<{ nObj?: typeof nObj1 }>({})

    const events: any[] = []
    const disposer = reaction(
      () => nParent.nObj,
      (v) => {
        events.push([v?.a, isNode(v!)])
      }
    )

    nParent.nObj = nodeData1

    expect(events.length).toBe(1)
    events.length = 0

    nParent.nObj = nodeData2

    console.log(events)
    expect(events.length).toBe(1)
    events.length = 0

    disposer()
  } finally {
    configure({ enforceActions: "always" })
  }
})
