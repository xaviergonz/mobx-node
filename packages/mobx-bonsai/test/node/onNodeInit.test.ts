import { runInAction } from "mobx"
import { node, nodeType, onDeepChange, onNodeInit } from "../../src"

test("should call children onNodeInit callbacks before parent", () => {
  const callOrder: string[] = []

  const dispose1 = onNodeInit("parent", (node: any) => {
    callOrder.push(node[nodeType])
  })

  const dispose2 = onNodeInit("child", (node: any) => {
    callOrder.push(node[nodeType])
  })

  node({
    [nodeType]: "parent",
    children: [{ [nodeType]: "child" }],
  })

  expect(callOrder).toStrictEqual(["child", "parent"])

  dispose1()
  dispose2()
})

test("should pick up property changes during initialization for deep observation", () => {
  const events: unknown[] = []

  const dispose = onNodeInit("1", (node: any) => {
    events.push("init")
    node.value++
  })

  const root = node<{
    child?: {
      [nodeType]: string
      value: number
    }
  }>({})

  expect(events).toStrictEqual([])

  onDeepChange(root, (change) => {
    events.push({ change })
  })

  runInAction(() => {
    root.child = {
      [nodeType]: "1",
      value: 1,
    }
  })

  expect(events).toMatchInlineSnapshot(`
[
  "init",
  {
    "change": {
      "debugObjectName": "ObservableObject@7",
      "name": "child",
      "newValue": {
        "$$type": "1",
        "value": 2,
      },
      "object": {
        "child": {
          "$$type": "1",
          "value": 2,
        },
      },
      "observableKind": "object",
      "type": "add",
    },
  },
]
`)
  expect(root.child!.value).toBe(2)

  dispose()
})

it("should use onNodeInit for migrations", () => {
  interface OldTodo {
    [nodeType]: "todo"
    text: string
  }

  interface Todo extends OldTodo {
    done: boolean
  }

  const dispose = onNodeInit("todo", (todo: OldTodo | Todo) => {
    if (!("done" in todo)) {
      ;(todo as Todo).done = false
    }
  })

  const todo = node<OldTodo>({ [nodeType]: "todo", text: "Buy milk" }) as Todo

  expect(todo.done).toBe(false)

  dispose()
})
