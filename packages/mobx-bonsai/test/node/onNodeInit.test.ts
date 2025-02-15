import { runInAction } from "mobx"
import { node, onDeepChange, onNodeInit } from "../../src"

test("should call children onNodeInit callbacks before parent", () => {
  const callOrder: string[] = []

  onNodeInit(["type", "parent"], (node: any) => {
    callOrder.push(node.type)
  })

  onNodeInit(["type", "child"], (node: any) => {
    callOrder.push(node.type)
  })

  node({
    type: "parent",
    children: [{ type: "child" }],
  })

  expect(callOrder).toStrictEqual(["child", "parent"])
})

test("selector functions should work", () => {
  const callOrder: string[] = []

  onNodeInit(
    (node: any) => node.$type === "1",
    (node: any) => {
      callOrder.push("init")
      node.value++
    }
  )

  const n = node({
    $type: "1",
    value: 1,
  })

  expect(callOrder).toStrictEqual(["init"])
  expect(n.value).toBe(2)
})

test("should pick up property changes during initialization for deep observation", () => {
  const events: unknown[] = []

  onNodeInit("1", (node: any) => {
    events.push("init")
    node.value++
  })

  const root = node<{
    child?: {
      $type: string
      value: number
    }
  }>({})

  expect(events).toStrictEqual([])

  onDeepChange(root, (change) => {
    events.push({ change })
  })

  runInAction(() => {
    root.child = {
      $type: "1",
      value: 1,
    }
  })

  expect(events).toMatchInlineSnapshot(`
[
  "init",
  {
    "change": {
      "debugObjectName": "ObservableObject@3",
      "name": "child",
      "newValue": {
        "$type": "1",
        "value": 2,
      },
      "object": {
        "child": {
          "$type": "1",
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
})

it("should use onNodeInit for migrations", () => {
  interface OldTodo {
    $type: "todo"
    text: string
  }

  interface Todo extends OldTodo {
    done: boolean
  }

  onNodeInit(["$type", "todo"], (todo: OldTodo | Todo) => {
    if (!("done" in todo)) {
      ;(todo as Todo).done = false
    }
  })

  const todo = node<OldTodo>({ $type: "todo", text: "Buy milk" }) as Todo

  expect(todo.done).toBe(false)
})
