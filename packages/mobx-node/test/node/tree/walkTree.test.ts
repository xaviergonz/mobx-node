import { node, walkTree, WalkTreeMode, MobxNode } from "../../../src"

it("should visit nodes in ParentFirst mode in expected order", () => {
  const root = node({
    a: { value: "A" },
    b: { value: "B" },
  })
  const visited: MobxNode[] = []
  walkTree(
    root,
    (n) => {
      visited.push(n)
    },
    WalkTreeMode.ParentFirst
  )

  expect(visited).toEqual([root, root.a, root.b])
})

it("should visit nodes in ChildrenFirst mode in expected order", () => {
  const root = node({
    a: { value: "A" },
    b: {
      value: "B",
      c: { value: "C" },
    },
  })
  const visited: MobxNode[] = []
  walkTree(
    root,
    (n) => {
      visited.push(n)
    },
    WalkTreeMode.ChildrenFirst
  )
  expect(visited).toEqual([root.a, root.b.c, root.b, root])
})

it("should stop walking when visitor returns a value", () => {
  const root = node({
    a: { value: 1 },
    b: { value: 2 },
  })
  const result = walkTree(
    root,
    (n) => {
      if ("value" in n && n.value === 2) {
        return "found"
      }
      return undefined
    },
    WalkTreeMode.ParentFirst
  )
  expect(result).toBe("found")
})
