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
   * Disposes the binding.
   */
  dispose: () => void
} {
  yjsOrigin = yjsOrigin ?? Symbol("mobx-yjs-origin")

  const mobxObservable = createMobxObservableFromYjsObject<T>(yjsObject)

  const disposeYjsToMobxReplication = setupYjsToMobxReplication({
    mobxObservable,
    yjsObject,
    yjsOrigin,
  })

  const disposeMobxToYjsReplication = setupMobxToYjsReplication({
    mobxObservable,
    yjsDoc,
    yjsObject,
    yjsOrigin,
  })

  return {
    mobxObservable,

    dispose: () => {
      disposeMobxToYjsReplication()
      disposeYjsToMobxReplication()
    },
  }
}
