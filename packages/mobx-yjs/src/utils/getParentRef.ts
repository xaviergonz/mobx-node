import { assertIsObservablePlainStructure } from "../plainTypes/assertions"
import { PlainStructure } from "../plainTypes/types"

export type ParentRef<TParent, TRoot> =
  | { parent: TParent; parentPath: string; root: TRoot }
  | { parent: undefined; parentPath: undefined; root: TRoot }

export type GetParentRef = <TParent = unknown, TRoot = unknown>(
  struct: PlainStructure
) => ParentRef<TParent, TRoot> | undefined

export const registeredGetParentRefs = new Set<GetParentRef>()

/**
 * If there's a parent in the observable tree it will return:
 *
 * ```ts
 * {
 *   parent: parentObject,
 *   parentPath: "propertyName",
 *   root: rootObject
 * }
 * ```
 *
 * In the case it is the root of an observable tree, it will return:
 * ```ts
 * {
 *   parent: undefined,
 *   parentPath: undefined,
 *   root: rootObject
 * }
 *
 * In the case it is not part of an observable tree any longer, it will return `undefined`.
 */
export const getParentRef: GetParentRef = (struct) => {
  assertIsObservablePlainStructure(struct)

  for (const get of registeredGetParentRefs) {
    const parentRef = get(struct)
    if (parentRef) {
      return parentRef as ParentRef<any, any>
    }
  }

  return undefined
}
