<p align="center">
  <h1 align="center">mobx-node</h1>
</p>
<p align="center">
  <i>A lightweight alternative to MobX-State-Tree + Y.js two-way binding</i>
</p>

<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/mobx-node">
    <img src="https://img.shields.io/npm/v/mobx-node.svg?style=for-the-badge&logo=npm&labelColor=333" />
  </a>
  <a aria-label="License" href="./LICENSE">
    <img src="https://img.shields.io/npm/l/mobx-node.svg?style=for-the-badge&labelColor=333" />
  </a>
  <a aria-label="Types" href="./packages/lib/tsconfig.json">
    <img src="https://img.shields.io/npm/types/mobx-node.svg?style=for-the-badge&logo=typescript&labelColor=333" />
  </a>
  <br />
  <a aria-label="CI" href="https://github.com/xaviergonz/mobx-node/actions/workflows/main.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/xaviergonz/mobx-node/main.yml?branch=master&label=CI&logo=github&style=for-the-badge&labelColor=333" />
  </a>
  <a aria-label="Codecov" href="https://codecov.io/gh/xaviergonz/mobx-node">
    <img src="https://img.shields.io/codecov/c/github/xaviergonz/mobx-node?token=6MLRFUBK8V&label=codecov&logo=codecov&style=for-the-badge&labelColor=333" />
  </a>
</p>

### Installation

> `npm install mobx-node`

> `yarn add mobx-node`

### Using computeds with nodes

While declaring actions that affect the observable data tree is easy (see for example `toggleTodoDone` in the example above), using computed values might not seem as straightforward. While in "classical" MobX you'd generate the computed values as a getter for the object, that's not a possibility here (since the object is auto-generated). In order to overcome this limitation this library offers a function called `computedProp`, which allows you to declare functional getters, this is, getters that take the object as argument.

In other words, where you would usually have this in "classical" MobX:

```ts
const myName = observable({
  firstName: "John",
  lastName: "Doe",
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
})

const fullName = myName.fullName
```

you can now use this for the observable objects:

```ts
type Name = { firstName: string, lastName: string }

const getFullName = computedProp((name: Name) => {
  return `${name.firstName} ${name.lastName}`
})

const fullName = getFullName(myName)
```

### Getting immutable snapshots of a data tree node

The function `getSnapshot` creates a deep, immutable copy of a node in the observable data tree. This snapshot provides a plain JavaScript representation of the state at the time of calling, ensuring that further changes to the observable do not affect the snapshot.

Note that snapshots maintain referential integrity: when you update a primitive in the root node, only the top-level reference is replaced. In contrast, if you update a primitive inside a nested child node, the reference of that child and each of its parent nodes (up to the root) will be updated. This behavior guarantees that changes are accurately tracked at the proper hierarchical level.

Using `getSnapshot` can be useful when you need a consistent view of the state for debugging, logging, or diffing purposes.

Note: `getSnapshot` only works for nodes that are currently part of the data tree. If a node is not part of the data tree the returned snapshot will be `undefined`.

For example, you can capture the current state of your application like this:

```ts
const currentState = getSnapshot(todoAppState);
```

The `currentState` will be a plain JavaScript object containing the data from `todoAppState`, and any changes made afterwards to `todoAppState` will not impact `currentState`.

You can also capture a snapshot of any nested node in your observable tree:

```ts
const firstTodoSnapshot = getSnapshot(todoAppState.todoList[0]);
```

This produces an immutable copy of the todo item.


## Traversing the observable tree

### Getting parent nodes

The `getParentRef` function that can be used to get the parent ref (parent object and path) of any nodes inside the observable object:

```ts
const { parent, parentPath } = getParentRef(mobxObservable.someChild);
// { parent: mobxObservable, parentPath: 'someChild', root: mobxObservable }

const { parent, parentPath } = getParentRef(mobxObservable); // root node
// { parent: undefined, parentPath: undefined, root: mobxObservable }
```

If it is not in the data tree of any of the bound mobx observables it will return `undefined`.

### Node limits

- A node that is already part of a tree cannot be reused in another tree or another section of the same tree. To move an object, first remove it from its current location or clone it using the `clone` function.

## Y.js two-way data binding

`mobx-node` includes a binding with Y.js that creates a node that stays in sync with a Y.js state in both directions.

For example, if you already have a Y.js state representing:

```ts
interface Todo {
  done: boolean
  text: string
}

interface TodoAppState {
  todoList: Todo[]
}
```

and that it is already prepopulated with some todos in a Y.js doc map named "todoAppState". All you need to do is:

```ts
const {
  mobxNode: todoAppState,
  dispose
} = bindYjsToMobxNode<TodoAppState>({
  yjsDoc,
  yjsObject: yjsDoc.getMap("todoAppState"),
})
```

and from then on you can read/write the state as if it were a MobX observable, this is:

```ts
// read
const doneTodos = todoAppState.todoList.filter(todo => todo.done)

// write
const toggleTodoDone = action((todo: Todo) => {
  todo.done = !todo.done;
})

toggleTodoDone(todoAppState.todoList[0])
```

and it will be kept in sync with the Y.js state.

Note that **the sync is two-way**, so if Y.js state gets updated (manually or via a remote state update), the node will get updates as well. All that means that this:

```ts
yjsDoc.transact(() => {
  const newTodo = new Y.Map()
  newTodo.set("done", false)
  newTodo.set("text", "buy milk")
  yjsDoc.getMap("todoAppState").getArray("todoList").push([ newTodo ])
})
```

will also result in a new todo getting added to `todoAppState.todoList` after the transaction is finished.

And of course, since this is a `mobx-node` enhanced MobX observable in the end, you can use reaction, autorun, when, computed, getParent, getSnapshot...

### What if I don't have an intial Y.js state yet?

You can create one like this:

```ts
applyPlainObjectToYMap(
  yjsDoc.getMap("todoAppState"),
  {
    todoList: []
  }
)
```

### Y.js binding limits

- Changes in the MobX observable are replicated to Y.js only after the outermost MobX action has completed. Therefore, avoid executing any Y.js transactions until MobX actions finish.
- Y.js changes are merged into the MobX observable only after all Y.js transactions have concluded. Consequently, do not initiate MobX actions that modify the bound object during an ongoing Y.js transaction.
