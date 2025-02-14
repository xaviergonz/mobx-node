import { assertIsNode, Node } from "../node"
import { getChildrenNodes } from "./getChildrenNodes"

/**
 * Mode for the `walkTree` method.
 */
export enum WalkTreeMode {
  /**
   * The walk will be done parent (roots) first, then children.
   */
  ParentFirst = "parentFirst",
  /**
   * The walk will be done children (leafs) first, then parents.
   */
  ChildrenFirst = "childrenFirst",
}

/**
 * Walks a tree, running the predicate function for each node.
 * If the predicate function returns something other than undefined,
 * then the walk will be stopped and the function will return the returned value.
 *
 * @typeparam T Returned node type, defaults to void.
 * @param root Subtree root node.
 * @param visit Function that will be run for each node of the tree.
 * @param mode Mode to walk the tree, as defined in `WalkTreeMode`.
 * @returns The value returned by the predicate function that stopped the walk,
 * or undefined if the walk was completed.
 */
export function walkTree<T = void>(
  root: Node,
  visit: (node: Node) => T | undefined,
  mode: WalkTreeMode
): T | undefined {
  assertIsNode(root)

  if (mode === WalkTreeMode.ParentFirst) {
    return walkTreeParentFirst(root, visit)
  } else {
    return walkTreeChildrenFirst(root, visit)
  }
}

function walkTreeParentFirst<T = void>(
  root: Node,
  visit: (node: Node) => T | undefined
): T | undefined {
  const stack: Node[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()!

    const ret = visit(node)
    if (ret !== undefined) {
      return ret
    }

    const children = getChildrenNodes(node)

    stack.length += children.size
    let i = stack.length - 1

    const childrenIter = children.values()
    let ch = childrenIter.next()
    while (!ch.done) {
      stack[i--] = ch.value
      ch = childrenIter.next()
    }
  }

  return undefined
}

function walkTreeChildrenFirst<T = void>(
  root: Node,
  visit: (node: Node) => T | undefined
): T | undefined {
  const childrenIter = getChildrenNodes(root).values()
  let ch = childrenIter.next()
  while (!ch.done) {
    const ret = walkTreeChildrenFirst(ch.value, visit)
    if (ret !== undefined) {
      return ret
    }
    ch = childrenIter.next()
  }

  const ret = visit(root)
  if (ret !== undefined) {
    return ret
  }

  return undefined
}
