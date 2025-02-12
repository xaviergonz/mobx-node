import * as Y from "yjs"
import { setupMobxToYjsReplication } from "./mobxToYjs/setupMobxToYjsReplication"
import { PlainStructure, YjsStructure } from "./types"
import { createMobxObservableFromYjsObject } from "./yjsToMobx/createMobxObservableFromYjsObject"
import { setupYjsToMobxReplication } from "./yjsToMobx/setupYjsToMobxReplication"

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
   * Returns the parent array/object of the given array/object inside the observable tree.
   */
  getParent: <TParent extends PlainStructure = never>(
    struct: PlainStructure
  ) => { parent: TParent; parentPath: string } | undefined

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

    getParent: <TParent extends PlainStructure = never>(struct: PlainStructure) => {
      const parentNode = mobxToYjsReplicationAdmin.getParentNode(struct)
      if (!parentNode) {
        return undefined
      }
      return {
        parent: parentNode.parent as TParent,
        parentPath: parentNode.parentPath,
      }
    },

    dispose: () => {
      mobxToYjsReplicationAdmin.dispose()
      yjsToMobxReplicationAdmin.dispose()
    },
  }
}
