import { runInAction, reaction } from "mobx"
import { node, getParentNode, ParentNode } from "../../src"

describe("getParentNode - object roots", () => {
  it("should return undefined for a root object", () => {
    const root = node({ a: 1 })
    expect(getParentNode(root)).toBeUndefined()
  })

  it("should return the correct parent for a child node", () => {
    const parent = node({ child: { b: 2 } })
    const child = parent.child
    const parentRef = getParentNode(child)
    expect(parentRef!.parent).toBe(parent)
    expect(parentRef!.parentPath).toBe("child")
  })

  it("should update parent reference when a child is moved", () => {
    type N = { child?: { b: number }; child2?: { b: number } }
    const parent1 = node<N>({ child: { b: 2 } })
    const parent2 = node<N>({})
    const child = parent1.child!
    runInAction(() => {
      parent1.child = undefined // detach from parent1
    })
    runInAction(() => {
      parent2.child2 = child // reattach to parent2
    })
    const parentRef = getParentNode(child)
    expect(parentRef!.parent).toBe(parent2)
    expect(parentRef!.parentPath).toBe("child2")
  })

  it("should react to changes in parent assignment for object child", () => {
    type N = { child?: { b: number }; child2?: { b: number } }
    const parent1 = node<N>({ child: { b: 2 } })
    const parent2 = node<N>({})
    const child = parent1.child!

    const parents: (ParentNode<unknown> | undefined)[] = []
    reaction(
      () => getParentNode(child),
      (parent) => {
        parents.push(parent)
      }
    )

    runInAction(() => {
      parent1.child = undefined // detach from parent1
    })
    expect(parents).toMatchInlineSnapshot(`
[
  undefined,
]
`)
    parents.length = 0

    runInAction(() => {
      parent2.child2 = child // reattach to parent2
    })
    expect(parents).toMatchInlineSnapshot(`
[
  {
    "parent": {
      "child2": {
        "b": 2,
      },
    },
    "parentPath": "child2",
  },
]
`)
  })
})

describe("getParentNode - array roots", () => {
  it("should return undefined for a root array", () => {
    const arr = node([{ a: 1 }])
    expect(getParentNode(arr)).toBeUndefined()
  })

  it("should return the correct parent for an array element", () => {
    const arr = node([{ a: 1 }])
    const element = arr[0]
    const parentRef = getParentNode(element)
    expect(parentRef!.parent).toBe(arr)
    expect(parentRef!.parentPath).toBe("0")
  })

  it("should update parent reference when an item is moved between arrays", () => {
    const arr1 = node([{ a: 1 }])
    const arr2 = node<{ a: number }[]>([])
    const element = arr1[0]
    runInAction(() => {
      arr1.shift() // remove element from arr1
    })
    runInAction(() => {
      arr2.push(element) // reattach to arr2 at index 0
    })
    const parentRef = getParentNode(element)
    expect(parentRef!.parent).toBe(arr2)
    expect(parentRef!.parentPath).toBe("0")
  })

  it("should react to changes in parent assignment for an array element", () => {
    const arr1 = node([{ a: 1 }])
    const arr2 = node<{ a: number }[]>([])
    const element = arr1[0]

    const parents: (ParentNode<unknown> | undefined)[] = []
    const disposer = reaction(
      () => getParentNode(element),
      (parent) => {
        parents.push(parent)
      }
    )

    runInAction(() => {
      arr1.shift() // detach the element
    })
    expect(parents).toMatchInlineSnapshot(`
[
  undefined,
]
`)
    parents.length = 0

    runInAction(() => {
      arr2[0] = element // reattach to arr2
    })
    expect(parents).toMatchInlineSnapshot(`
[
  {
    "parent": [
      {
        "a": 1,
      },
    ],
    "parentPath": "0",
  },
]
`)
    disposer()
  })
})
