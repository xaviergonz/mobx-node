import { runInAction, reaction } from "mobx"
import { node, getRootPath, RootPath, Node } from "../../../src"

describe("getRootPath", () => {
  it("should return empty path for a root node (object)", () => {
    const root = node({ a: 1 })
    const rootPath = getRootPath(root)
    expect(rootPath.root).toBe(root)
    expect(rootPath.path).toEqual([])
    expect(rootPath.pathObjects).toEqual([root])
  })

  it("should return correct path for a nested object node", () => {
    const root = node({ child: { a: 1 } })
    const child = root.child
    const childPath = getRootPath(child)
    expect(childPath.root).toBe(root)
    expect(childPath.path).toEqual(["child"])
    expect(childPath.pathObjects).toEqual([root, child])
  })

  it("should return correct path for a multi-level nested object", () => {
    const root = node({ child: { grandchild: { a: 1 } } })
    const child = root.child
    const grandchild = child.grandchild
    const gp: RootPath<Node> = getRootPath(grandchild)
    expect(gp.root).toBe(root)
    expect(gp.path).toEqual(["child", "grandchild"])
    expect(gp.pathObjects).toEqual([root, child, grandchild])
  })

  it("should return empty path for a root node (array)", () => {
    const arr = node([{ a: 1 }])
    const rootPath: RootPath<Node> = getRootPath(arr)
    expect(rootPath.root).toBe(arr)
    expect(rootPath.path).toEqual([])
    expect(rootPath.pathObjects).toEqual([arr])
  })

  it("should return correct path for an element in an array", () => {
    const arr = node([{ a: 1 }])
    const element = arr[0]
    const elemPath: RootPath<Node> = getRootPath(element)
    expect(elemPath.root).toBe(arr)
    expect(elemPath.path).toEqual(["0"])
    expect(elemPath.pathObjects).toEqual([arr, element])
  })

  it("should update the path when a node is moved", () => {
    type N = { child?: { a: number }; child2?: { a: number } }
    const root1 = node<N>({ child: { a: 1 } })
    const root2 = node<N>({})
    const child = root1.child!
    runInAction(() => {
      root1.child = undefined // detach child from root1
    })
    runInAction(() => {
      root2.child2 = child // attach child to root2 under 'child2'
    })
    const childPath: RootPath<Node> = getRootPath(child)
    expect(childPath.root).toBe(root2)
    expect(childPath.path).toEqual(["child2"])
    expect(childPath.pathObjects).toEqual([root2, child])
  })

  it("should react to changes in node path", () => {
    type N = { child?: { a: number }; childRenamed?: { a: number } }
    const root = node<N>({ child: { a: 1 } })
    const child = root.child!

    const paths: RootPath<Node>[] = []
    const disposer = reaction(
      () => getRootPath(child),
      (newPath) => {
        paths.push(newPath)
      }
    )
    // Initially, child is under key "child"
    expect(getRootPath(child).path).toEqual(["child"])

    runInAction(() => {
      // Rename property: detach 'child' and assign it to 'childRenamed'
      root.child = undefined
      root.childRenamed = child
    })
    const updated = getRootPath(child)
    expect(updated.path).toEqual(["childRenamed"])
    disposer()
    expect(paths).toStrictEqual([updated])
  })
})
