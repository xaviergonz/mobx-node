import { configure, isObservable, observable, reaction, runInAction } from "mobx"
import { node, isNode, getSnapshot, nodeTypeKey, nodeType, TNode } from "../../src"

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
  type TType = TNode<"type", { id: string }>
  using tType = nodeType<TType>("type").withKey("id")

  type TType2 = TNode<"type2", { id: string }>
  using tType2 = nodeType<TType2>("type2").withKey("id")

  type TType3 = TNode<"type3", { id: string }>
  using tType3 = nodeType<TType3>("type3").withKey("id")

  type TType4 = TNode<"type4", { id: string }>
  using tType4 = nodeType<TType4>("type4").withKey("id")

  const nObj1 = tType({ id: "key" })
  expect(node(getSnapshot(nObj1))).toBe(nObj1)

  // different key
  const nObj2 = tType2({ id: "key2" })
  expect(tType2({ id: "key3" })).not.toBe(nObj2)

  // different type
  const nObj3 = tType3({ id: "key" })
  const nObj4 = tType4({ id: "key" })
  expect(nObj3).not.toBe(nObj4)
})

it("unique node reconciliation", () => {
  type T2 = TNode<
    "t2",
    {
      id: string
      a: number
    }
  >

  type T = TNode<
    "t",
    {
      id: string
      a: number
      b: { c: number }
      arr: { d: number }[]
      arr2: { d: number }[]
      uni: T2
    }
  >

  using tT = nodeType<T>("t").withKey("id")
  using tT2 = nodeType<T2>("t2").withKey("id")

  const nObj1 = tT({
    id: "key",
    a: 1,
    b: { c: 1 },
    arr: [{ d: 1 }],
    arr2: [{ d: 1 }, { d: 1 }],
    uni: tT2({
      id: "key",
      a: 1,
    }),
  })
  const arr = nObj1.arr
  const uni1 = nObj1.uni

  const obj2 = {
    [nodeTypeKey]: tT.typeId,
    id: "key",
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
    uni: tT2.snapshot({
      id: "key",
      a: 2,
    }),
  }
  const nObj2 = node(obj2)

  expect(nObj2).toBe(nObj1)
  expect(nObj2.arr).toBe(arr)
  expect(nObj2.arr[0]).toBe(arr[0])
  expect(nObj2.uni).toBe(uni1)

  expect(getSnapshot(nObj2)).toStrictEqual(obj2)
})

it("swapping a node in an array should be ok if we reconciliate", () => {
  type TA = TNode<"a", { id: string; a: number }>
  using tA = nodeType<TA>("a").withKey("id")

  const nObj1 = node([
    tA.snapshot({
      id: "1",
      a: 1,
    }),
    tA.snapshot({
      id: "2",
      a: 2,
    }),
  ])
  const n1 = nObj1[0]
  const n2 = nObj1[1]

  const nObj2 = node([
    tA.snapshot({
      id: "2",
      a: 3,
    }),
    tA.snapshot({
      id: "1",
      a: 4,
    }),
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
    type TA2 = TNode<"a2", { id: string; a: number }>
    using tA2 = nodeType<TA2>("a2").withKey("id")

    const nodeData1 = tA2.snapshot({
      id: "1",
      a: 1,
    })
    const nObj1 = tA2(nodeData1)

    const nodeData2 = tA2.snapshot({
      id: "2",
      a: 2,
    })
    tA2(nodeData2)

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

    expect(events.length).toBe(1)
    events.length = 0

    disposer()
  } finally {
    configure({ enforceActions: "always" })
  }
})

test("auto generates key if missing in snapshot", () => {
  type Todo = TNode<"todo", { id: string; title: string }>
  using tTodo = nodeType<Todo>("todo").withKey("id")

  const node = tTodo.snapshot({
    title: "Test Todo",
    // id is omitted intentionally
  })
  expect(node.id).toBe("id-1")
})

test("typed nodes with actions/getters/computeds/volatile", () => {
  type Todo = TNode<"todo", { id: string; title: string }>
  using tTodo = nodeType<Todo>("todo")
    .withKey("id")
    .volatile({
      x: () => 3,
    })
    .getters((t) => ({
      getTitleLengthPlusXPlusParam(param: number) {
        return tTodo.getTitleLength(t) + tTodo.getX(t) + param
      },
    }))
    .computeds((t) => ({
      getTitleLength() {
        return t.title.length
      },
      getTitleLength2: {
        get() {
          return t.title.length
        },
        // TODO: can we fix this so it will infer a and b to be number instead of any?
        equals: (a, b) => a === b,
      },
    }))
    .actions((t) => ({
      setTitle(title: string) {
        t.title = title
      },
    }))

  const node = tTodo({
    title: "Test Todo",
    // id is omitted intentionally
  })

  expect(tTodo.getTitleLength(node)).toBe(9)
  expect(tTodo.getTitleLength2(node)).toBe(9)
  expect(tTodo.getTitleLengthPlusXPlusParam(node, 5)).toBe(17)
  expect(tTodo.getX(node)).toBe(3)

  tTodo.setTitle(node, "Test Todo 2")
  expect(node.title).toBe("Test Todo 2")

  tTodo.setX(node, 4)
  expect(tTodo.getX(node)).toBe(4)

  expect(tTodo.getTitleLength(node)).toBe(11)
  expect(tTodo.getTitleLength2(node)).toBe(11)
  expect(tTodo.getTitleLengthPlusXPlusParam(node, 5)).toBe(20)
  expect(tTodo.getX(node)).toBe(4)
})

test("untyped nodes with actions/getters/computeds/volatile", () => {
  type Todo = { title: string }
  const tTodo = nodeType<Todo>()
    .volatile({
      x: () => 3,
    })
    .getters((t) => ({
      getTitleLengthPlusXPlusParam(param: number) {
        return tTodo.getTitleLength(t) + tTodo.getX(t) + param
      },
    }))
    .computeds((t) => ({
      getTitleLength() {
        return t.title.length
      },
      getTitleLength2: {
        get() {
          return t.title.length
        },
        // TODO: can we fix this so it will infer a and b to be number instead of any?
        equals: (a, b) => a === b,
      },
    }))
    .actions((t) => ({
      setTitle(title: string) {
        t.title = title
      },
    }))

  const node = tTodo({
    title: "Test Todo",
  })

  expect(tTodo.getTitleLength(node)).toBe(9)
  expect(tTodo.getTitleLength2(node)).toBe(9)
  expect(tTodo.getTitleLengthPlusXPlusParam(node, 5)).toBe(17)
  expect(tTodo.getX(node)).toBe(3)

  tTodo.setTitle(node, "Test Todo 2")
  expect(node.title).toBe("Test Todo 2")

  tTodo.setX(node, 4)
  expect(tTodo.getX(node)).toBe(4)

  expect(tTodo.getTitleLength(node)).toBe(11)
  expect(tTodo.getTitleLength2(node)).toBe(11)
  expect(tTodo.getTitleLengthPlusXPlusParam(node, 5)).toBe(20)
  expect(tTodo.getX(node)).toBe(4)
})

it("should support getters, computeds, volatiles and actions for untyped nodes over arrays", () => {
  // Create an untyped node factory for an array of objects with { title, count } properties
  const untypedFactory = nodeType<{ title: string; count: number }[]>()
    .volatile({
      len: () => 0,
    })
    .actions((arr) => ({
      incrementAt(index: number) {
        arr[index].count += 1
      },
    }))
    .getters((arr) => ({
      getTitleAt(index: number) {
        return arr[index].title
      },
    }))
    .computeds((arr) => ({
      getTotalTitleLength() {
        return arr.reduce((sum, item) => sum + item.title.length, 0)
      },
    }))

  const data = [
    { title: "hello", count: 0 },
    { title: "world", count: 0 },
  ]
  const nArr = untypedFactory(data)

  // Verify volatile method returns its default value.
  expect(untypedFactory.getLen(nArr)).toBe(0)

  // Test action: increment count at index 0.
  untypedFactory.incrementAt(nArr, 0)
  expect(nArr[0].count).toBe(1)

  // Test getter: returns title at index 1.
  expect(untypedFactory.getTitleAt(nArr, 1)).toBe("world")

  // Test computed: total title length should equal "hello".length + "world".length.
  expect(untypedFactory.getTotalTitleLength(nArr)).toBe(5 + 5)
})

test("node type with setters", () => {
  type Book = { title: string; author: string; pageCount: number }
  const tBook = nodeType<Book>().settersFor("title", "author", "pageCount")

  const book = tBook({
    title: "1984",
    author: "George Orwell",
    pageCount: 328,
  })

  tBook.setTitle(book, "Animal Farm")
  tBook.setAuthor(book, "G. Orwell")
  tBook.setPageCount(book, 112)

  expect(book.title).toBe("Animal Farm")
  expect(book.author).toBe("G. Orwell")
  expect(book.pageCount).toBe(112)
})

test("node type setters work with readonly arrays", () => {
  type TodoList = {
    name: string
    todos: string[]
  }

  const tTodoList = nodeType<TodoList>().settersFor("name", "todos")

  const todoList = tTodoList({
    name: "Shopping List",
    todos: ["Milk", "Eggs"],
  })

  // Create a readonly array
  const newTodos: readonly string[] = ["Bread", "Cheese", "Apples"] as const

  // This should compile and work properly
  tTodoList.setTodos(todoList, newTodos)

  expect(todoList.todos).toEqual(["Bread", "Cheese", "Apples"])
  expect(todoList.todos).not.toBe(newTodos) // Should be a different array reference
})

test("node type with defaults for untyped nodes", () => {
  type Book = { title: string; author: string; pageCount: number }

  // Create a node type with defaults for pageCount
  const TBook = nodeType<Book>().defaults({
    pageCount: () => 100,
    author: () => "Unknown Author",
  })

  // Test creating with some defaults omitted
  const book1 = TBook({
    title: "1984",
    // author and pageCount are omitted
  })

  expect(book1.title).toBe("1984")
  expect(book1.author).toBe("Unknown Author")
  expect(book1.pageCount).toBe(100)

  // Test creating with explicit values
  const book2 = TBook({
    title: "Animal Farm",
    author: "George Orwell",
    pageCount: 140,
  })

  expect(book2.title).toBe("Animal Farm")
  expect(book2.author).toBe("George Orwell")
  expect(book2.pageCount).toBe(140) // Explicit value should override default

  // Test that snapshot also uses defaults
  const bookSnapshot = TBook.snapshot({
    title: "Brave New World",
    // author and pageCount omitted
  })

  expect(bookSnapshot.title).toBe("Brave New World")
  expect(bookSnapshot.author).toBe("Unknown Author")
  expect(bookSnapshot.pageCount).toBe(100)
})

test("node type with defaults for typed nodes", () => {
  type TodoItem = TNode<
    "todo",
    {
      id: string
      title: string
      completed: boolean
      priority: number
    }
  >

  const TTodo = nodeType<TodoItem>("todo").defaults({
    completed: () => false,
    priority: () => 3,
  })

  // Test creating with defaults
  const todo1 = TTodo({
    id: "1",
    title: "Buy milk",
    // completed and priority are omitted
  })

  expect(todo1.id).toBe("1")
  expect(todo1.title).toBe("Buy milk")
  expect(todo1.completed).toBe(false)
  expect(todo1.priority).toBe(3)

  // Test snapshot with defaults
  const todoSnapshot = TTodo.snapshot({
    id: "2",
    title: "Buy eggs",
    // completed and priority are omitted
  })

  expect(todoSnapshot.id).toBe("2")
  expect(todoSnapshot.title).toBe("Buy eggs")
  expect(todoSnapshot.completed).toBe(false)
  expect(todoSnapshot.priority).toBe(3)
})

test("node type with defaults and withKey should auto-generate keys", () => {
  type User = TNode<
    "user",
    {
      id: string
      name: string
      email: string
    }
  >

  const TUser = nodeType<User>("user")
    .withKey("id")
    .defaults({
      email: () => "default@example.com",
    })

  // id should be auto-generated by withKey, email by defaults
  const user = TUser({
    name: "John Doe",
    // id and email are omitted
  })

  expect(user.id).toBeDefined()
  expect(user.name).toBe("John Doe")
  expect(user.email).toBe("default@example.com")
})

test("node type defaults should compose in order", () => {
  type Todo = { title: string; description: string; priority: number; tags: string[] }

  const TTodo = nodeType<Todo>()
    .defaults({
      description: () => "",
      priority: () => 1,
    })
    .defaults({
      tags: () => [],
      priority: () => 2, // This should override the previous default
    })

  const todo = TTodo({
    title: "Test task",
    // All other properties should use defaults
  })

  expect(todo.title).toBe("Test task")
  expect(todo.description).toBe("")
  expect(todo.priority).toBe(2) // Should use the last defined default
  expect(todo.tags).toEqual([])
})

test("node type defaults with arrays", () => {
  type TodoList = {
    name: string
    items: { task: string; done: boolean }[]
  }

  const TList = nodeType<TodoList>().defaults({
    items: () => [],
  })

  const list = TList({
    name: "My List",
    // items is omitted
  })

  expect(list.name).toBe("My List")
  expect(list.items).toEqual([])
  expect(Array.isArray(list.items)).toBe(true)
})

test("node type defaults with complex objects", () => {
  type Contact = {
    name: string
    address: {
      street: string
      city: string
      zip: string
    }
  }

  const TContact = nodeType<Contact>().defaults({
    address: () => ({ street: "", city: "", zip: "" }),
  })

  const contact = TContact({
    name: "John Smith",
    // address is omitted
  })

  expect(contact.name).toBe("John Smith")
  expect(contact.address).toEqual({ street: "", city: "", zip: "" })
  expect(isNode(contact.address)).toBe(true) // Should be converted to a node
})
