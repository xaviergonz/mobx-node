import { action, reaction, runInAction } from "mobx"
import { assertIsFunction } from "../../plainTypes/checks"
import { assertIsNode } from "../node"
import { getChildrenNodes } from "./getChildrenNodes"
import { disposeOnce } from "../../utils/disposeOnce"
import { createNodeSelector, NodeSelector } from "../utils/nodeSelector"
import { NodeType } from "../nodeTypeKey"

/**
 * Runs a callback everytime a new node is attached to a given node.
 * The callback can optionally return a disposer which will be run when the child is detached.
 *
 * @param target Function that returns the node whose children should be tracked.
 * @param childNodeType The node type (or array of types) for which it should be invoked, or undefined if it should be invoked for them all.
 * @param onChildAttached Callback called when a child is attached to the target node.
 * @param deep (default: `false`) Whether to run the callback for all children deeply or only for shallow children.
 * @param fireForCurrentChildren (default: `true`) Whether to immediately call the callback for already attached children.
 * @returns A disposer function. Pass `true` to run the detach disposers for children that had the attach event fired.
 */
export function onChildAttachedTo<T extends object = object>({
  target,
  childNodeType,
  onChildAttached,
  deep,
  fireForCurrentChildren,
}: {
  target: () => object
  childNodeType: NodeType | readonly NodeType[] | undefined
  onChildAttached: (child: T) => (() => void) | void
  deep?: boolean
  fireForCurrentChildren?: boolean
}): (runDetachDisposers: boolean) => void {
  assertIsFunction(target, "target")
  assertIsFunction(onChildAttached, "onChildAttached")

  deep ??= false
  fireForCurrentChildren ??= true

  let nodeSelector: NodeSelector | undefined
  if (childNodeType) {
    nodeSelector = createNodeSelector()

    if (Array.isArray(childNodeType)) {
      const types = childNodeType as readonly NodeType[]
      for (const type of types) {
        nodeSelector.addSelectorWithCallback(type, onChildAttached)
      }
    } else {
      const type = childNodeType as NodeType
      nodeSelector.addSelectorWithCallback(type, onChildAttached)
    }
  }

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

  const getChildrenObjectOpts = { deep }
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

  const currentChildren = fireForCurrentChildren ? new Set<object>() : getCurrentChildren()

  const disposeReaction = reaction(
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

          const callbacks = nodeSelector ? nodeSelector.selectNodeCallbacks(n) : [onChildAttached]
          runInAction(() => {
            for (const callback of callbacks) {
              const detachAction = callback(n as T)
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
    disposeReaction()

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
