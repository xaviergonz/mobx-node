<p align="center">
  <h1 align="center">mobx-yjs</h1>
</p>
<p align="center">
  <i>Create a MobX observable two-way bound to a Y.js state.</i>
</p>

<p align="center">
  <a aria-label="NPM version" href="https://www.npmjs.com/package/mobx-yjs">
    <img src="https://img.shields.io/npm/v/mobx-yjs.svg?style=for-the-badge&logo=npm&labelColor=333" />
  </a>
  <a aria-label="License" href="./LICENSE">
    <img src="https://img.shields.io/npm/l/mobx-yjs.svg?style=for-the-badge&labelColor=333" />
  </a>
  <a aria-label="Types" href="./packages/lib/tsconfig.json">
    <img src="https://img.shields.io/npm/types/mobx-yjs.svg?style=for-the-badge&logo=typescript&labelColor=333" />
  </a>
  <br />
  <a aria-label="CI" href="https://github.com/xaviergonz/mobx-yjs/actions/workflows/main.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/xaviergonz/mobx-yjs/main.yml?branch=master&label=CI&logo=github&style=for-the-badge&labelColor=333" />
  </a>
  <a aria-label="Codecov" href="https://codecov.io/gh/xaviergonz/mobx-yjs">
    <img src="https://img.shields.io/codecov/c/github/xaviergonz/mobx-yjs?token=6MLRFUBK8V&label=codecov&logo=codecov&style=for-the-badge&labelColor=333" />
  </a>
</p>

## Installation

> `npm install mobx-yjs`

> `yarn add mobx-yjs`

## Introduction

`mobx-yjs` creates a MobX observable that stays in sync with a Y.js state in both directions.

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
  mobxObservable: todoAppState,
  dispose
} = bindYjsToMobxObservable<TodoAppState>({
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

Note that **the sync is two-way**, so if Y.js state gets updated (manually or via a remote state update), the MobX observable will get updates as well. All that means that this:

```ts
yjsDoc.transact(() => {
  const newTodo = new Y.Map()
  newTodo.set("done", false)
  newTodo.set("text", "buy milk")
  yjsDoc.getMap("todoAppState").getArray("todoList").push([ newTodo ])
})
```

will also result in a new todo getting added to `todoAppState.todoList` after the transaction is finished.

And of course, since this is a MobX observable in the end, you can use reaction, autorun, when, computed...

## What if I don't have an intial Y.js state yet?

You can create one like this:

```ts
applyPlainObjectToYMap(
  yjsDoc.getMap("todoAppState"),
  {
    todoList: []
  }
)
```

## Getting parent nodes

The `bindYjsToMobxObservable` function also returns a `getParentRef` method that can be used to get the parent ref (parent object and path) of any nodes inside the observable object:

```ts
const { mobxObservable, getParentRef } = bindYjsToMobxObservable(...)

const { parent, parentPath } = getParentRef(mobxObservable.someChild);
// { parent: mobxObservable, parentPath: 'someChild' }
```

If it is not in the tree of the mobxObservable it will return `undefined`.

## Limits

- Changes in the MobX observable are replicated to Y.js only after the outermost MobX action has completed. Therefore, avoid executing any Y.js transactions until MobX actions finish.
- Y.js changes are merged into the MobX observable only after all Y.js transactions have concluded. Consequently, do not initiate MobX actions that modify the bound object during an ongoing Y.js transaction.
- An object that is already part of the observable tree cannot be reused in another section of the tree. To move an object, first remove it from its current location or clone it using MobX's `toJS` function.
