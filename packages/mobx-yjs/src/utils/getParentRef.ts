import { PlainStructure } from "../plainTypes/types"

export type ParentRef<TParent, TRoot> = { parent: TParent; parentPath: string; root: TRoot }

export type GetParentRef = <TParent = unknown, TRoot = unknown>(
  struct: PlainStructure
) => ParentRef<TParent, TRoot> | undefined

export const registeredGetParentRefs = new Set<GetParentRef>()

/**
 * Returns the parent array/object of the given array/object inside the observable tree
 * and the parentPath (property name).
 */
export const getParentRef: GetParentRef = (struct) => {
  for (const get of registeredGetParentRefs) {
    const parentRef = get(struct)
    if (parentRef) {
      return parentRef as ParentRef<any, any>
    }
  }

  return undefined
}
