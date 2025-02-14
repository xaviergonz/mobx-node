import { MobxNode } from "../node"
import { getParentPath } from "./getParentPath"

/**
 * Returns the parent object of the target node, or undefined if there's no parent.
 *
 * Note that this function will throw if the passed object is not a node.
 *
 * @typeparam TParent Parent object type.
 * @param node Node to get the parent path from.
 * @returns
 */
export function getParent<TParent extends MobxNode>(value: MobxNode): TParent | undefined {
  return getParentPath(value)?.parent as TParent | undefined
}
