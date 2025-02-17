import { action, reaction, runInAction } from "mobx"
import { assertIsFunction } from "../../plainTypes/checks"
import { assertIsNode } from "../node"
import { getChildrenNodes } from "./getChildrenNodes"
import { disposeOnce } from "../../utils/disposeOnce"
import {
  createNodeSelector,
  SelectNodeByProp,
  SelectNodeByTypeProp,
  SelectNodeFn,
} from "../utils/nodeSelector"

const alwaysFn = () => true

/**
 * Runs a callback everytime a new node is attached to a given node.
 * The callback can optionally return a disposer which will be run when the child is detached.
 *
 * @param target - Function that returns the node whose children should be tracked.
 * @param childNodeSelector - A node selector to run the callback only for certain kind of children.
 *   The selection criteria can be:
 *   - A tuple specifying a property name and its value.
 *   - A string specifying the value of the $type property.
 *   - A predicate function that tests if the given node should be selected.
 *   - `undefined` to run the callback for all children.
 *   Note that using a tuple or string selector is way faster than using a function selector or no selector at all.
 * @param onChildAttached - Callback called when a child is attached to the target node.
 * @param options - Optional options object.
 * @param options.deep - (default: `false`) Whether to run the callback for all children deeply or only for shallow children.
 * @param options.fireForCurrentChildren - (default: `true`) Whether to immediately call the callback for already attached children.
 * @returns A disposer function.
 */
export function onChildAttachedTo<T extends object = object>({
  target,
  childNodeSelector,
  onChildAttached,
  options,
}: {
  target: () => object
  childNodeSelector: SelectNodeByProp | SelectNodeByTypeProp | SelectNodeFn | undefined
  onChildAttached: (child: T) => (() => void) | void
  options?: {
    deep?: boolean
    fireForCurrentChildren?: boolean
  }
}): (runDetachDisposers: boolean) => void {
  assertIsFunction(target, "target")
  assertIsFunction(onChildAttached, "onChildAttached")

  const opts = {
    deep: false,
    fireForCurrentChildren: true,
    ...options,
  }

  const nodeSelector = createNodeSelector()
  nodeSelector.addSelectorWithCallback(childNodeSelector ?? alwaysFn, onChildAttached)

  const detachDisposers = new WeakMap<object, () => void>()

  const runDetachDisposer = (n: object) => {
    const detachDisposer = detachDisposers.get(n)
    if (detachDisposer) {
      detachDisposers.delete(n)
      detachDisposer()
    }
  }

  const addDetachDisposer = (n: object, disposer: (() => void) | void) => {
    if (disposer) {
      detachDisposers.set(n, action(disposer))
    }
  }

  const getChildrenObjectOpts = { deep: opts.deep }
  const getCurrentChildren = () => {
    const t = target()
    assertIsNode(t, "target()")

    const children = getChildrenNodes(t, getChildrenObjectOpts)

    const set = new Set<object>()

    const iter = children.values()
    let cur = iter.next()
    while (!cur.done) {
      set.add(cur.value)
      cur = iter.next()
    }

    return set
  }

  const currentChildren = opts.fireForCurrentChildren ? new Set<object>() : getCurrentChildren()

  const disposer = reaction(
    () => getCurrentChildren(),
    (newChildren) => {
      const disposersToRun: object[] = []

      // find dead
      const currentChildrenIter = currentChildren.values()
      let currentChildrenCur = currentChildrenIter.next()
      while (!currentChildrenCur.done) {
        const n = currentChildrenCur.value
        if (!newChildren.has(n)) {
          currentChildren.delete(n)

          // we should run it in inverse order
          disposersToRun.push(n)
        }

        currentChildrenCur = currentChildrenIter.next()
      }

      if (disposersToRun.length > 0) {
        for (let i = disposersToRun.length - 1; i >= 0; i--) {
          runDetachDisposer(disposersToRun[i])
        }
      }

      // find new
      const newChildrenIter = newChildren.values()
      let newChildrenCur = newChildrenIter.next()
      while (!newChildrenCur.done) {
        const n = newChildrenCur.value
        if (!currentChildren.has(n)) {
          currentChildren.add(n)

          const callbacks = nodeSelector.selectNodeCallbacks(n)
          runInAction(() => {
            for (const callback of callbacks) {
              const detachAction = callback(n)
              addDetachDisposer(n, detachAction)
            }
          })
        }

        newChildrenCur = newChildrenIter.next()
      }
    },
    {
      fireImmediately: true,
    }
  )

  return disposeOnce((runDetachDisposers: boolean) => {
    disposer()

    if (runDetachDisposers) {
      const currentChildrenIter = currentChildren.values()
      let currentChildrenCur = currentChildrenIter.next()
      while (!currentChildrenCur.done) {
        const n = currentChildrenCur.value
        runDetachDisposer(n)

        currentChildrenCur = currentChildrenIter.next()
      }
    }
    currentChildren.clear()
  })
}
