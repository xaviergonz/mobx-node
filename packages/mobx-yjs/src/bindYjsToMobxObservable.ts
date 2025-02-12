import * as Y from "yjs"
import { setupMobxToYjsReplication } from "./mobxToYjs/setupMobxToYjsReplication"
import { PlainStructure, YjsStructure } from "./types"
import { createMobxObservableFromYjsObject } from "./yjsToMobx/createMobxObservableFromYjsObject"
import { setupYjsToMobxReplication } from "./yjsToMobx/setupYjsToMobxReplication"
import { assertIsObservablePlainStructure } from "./yjsToMobx/assertions"

export type ParentRef<TParent> = { parent: TParent; parentPath: string }

/**
 * Creates a MobX observable that is bound to a Y.js data structure.
 * Y.js Map and Array instances are bound to MobX objects and arrays, respectively.
 */
export function bindYjsToMobxObservable<T extends PlainStructure>({
  yjsDoc,
  yjsObject,
  yjsOrigin,
}: {
  /**
   * The Y.js document.
   */
  yjsDoc: Y.Doc

  /**
   * The Y.js data structure to bind.
   */
  yjsObject: YjsStructure

  /**
   * The Y.js origin symbol used for binding transactions.
   * One will be automatically generated if not provided.
   */
  yjsOrigin?: symbol
}): {
  /**
   * The bound mobx observable instance.
   */
  mobxObservable: T

  /**
   * Returns the parent array/object of the given array/object inside the observable tree
   * and the parentPath (property name).
   */
  getParentRef: <TParent = unknown>(struct: PlainStructure) => ParentRef<TParent> | undefined

  /**
   * Disposes the binding.
   */
  dispose: () => void
} {
  yjsOrigin = yjsOrigin ?? Symbol("mobx-yjs-origin")

  const mobxObservable = createMobxObservableFromYjsObject<T>(yjsObject)

  const yjsReplicatingRef = { current: 0 }

  const yjsToMobxReplicationAdmin = setupYjsToMobxReplication({
    mobxObservable,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  const mobxToYjsReplicationAdmin = setupMobxToYjsReplication({
    mobxObservable,
    yjsDoc,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  return {
    mobxObservable,

    getParentRef: <TParent = unknown>(struct: PlainStructure) => {
      assertIsObservablePlainStructure(struct)

      const parentRef = mobxToYjsReplicationAdmin.getParentRef(struct)
      if (!parentRef) {
        return undefined
      }
      return {
        parent: parentRef.parent as TParent,
        parentPath: parentRef.parentPath,
      }
    },

    dispose: () => {
      mobxToYjsReplicationAdmin.dispose()
      yjsToMobxReplicationAdmin.dispose()
    },
  }
}
