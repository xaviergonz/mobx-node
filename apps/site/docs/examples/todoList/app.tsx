import { observer } from "mobx-react"
import { useState } from "react"
import { LogsView } from "./logs"
import { createRootStore, Todo, TodoList, TTodo, TTodoList } from "./store"

// we use mobx-react to connect to the data, as it is usual in mobx
// this library is framework agnostic, so it can work anywhere mobx can work
// (even outside of a UI)

export const App = observer(() => {
  const [rootStore] = useState(() => createRootStore())

  return (
    <>
      <TodoListView list={rootStore} />
      <br />
      <LogsView rootStore={rootStore} />
    </>
  )
})

export const TodoListView = observer(({ list }: { list: TodoList }) => {
  const [newTodo, setNewTodo] = useState("")

  const renderTodo = (todo: Todo) => (
    <TodoView
      key={todo.id}
      done={todo.done}
      text={todo.text}
      onClick={() => {
        TTodo.setDone(todo, !todo.done)
      }}
      onRemove={() => {
        TTodoList.remove(list, todo)
      }}
    />
  )

  return (
    <div>
      {TTodoList.getPending(list).length > 0 && (
        <>
          <h5>TODO</h5>
          {TTodoList.getPending(list).map((t) => renderTodo(t))}
        </>
      )}

      {TTodoList.getDone(list).length > 0 && (
        <>
          <h5>DONE</h5>
          {TTodoList.getDone(list).map((t) => renderTodo(t))}
        </>
      )}
      <br />
      <input
        value={newTodo}
        onChange={(ev) => {
          setNewTodo(ev.target.value || "")
        }}
        placeholder="I will..."
      />
      <button
        type="button"
        onClick={() => {
          TTodoList.add(list, TTodo({ text: newTodo, done: false }))
          setNewTodo("")
        }}
      >
        Add todo
      </button>
    </div>
  )
})

function TodoView({
  done,
  text,
  onClick,
  onRemove,
}: {
  done: boolean
  text: string
  onClick: () => void
  onRemove: () => void
}) {
  return (
    <div style={{ cursor: "pointer" }}>
      <span
        onClick={onClick}
        style={{
          textDecoration: done ? "line-through" : "inherit",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "1.5rem",
            textAlign: "center",
            marginRight: 8,
          }}
        >
          {done ? "✔️" : "👀"}
        </span>
        {text}
        {}
      </span>
      <span onClick={onRemove} style={{ marginLeft: 16 }}>
        ❌
      </span>
    </div>
  )
}
