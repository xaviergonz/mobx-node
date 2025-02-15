import * as Y from "yjs"
import { setupMobxNodeToYjsReplication } from "./mobxNodeToYjs/setupMobxNodeToYjsReplication"
import { createMobxNodeFromYjsObject } from "./yjsToMobxNode/createMobxNodeFromYjsObject"
import { setupYjsToMobxNodeReplication } from "./yjsToMobxNode/setupYjsToMobxNodeReplication"
import { YjsStructure } from "./yjsTypes/types"

/**
 * Creates a MobX node that is bound to a Y.js data structure.
 * Y.js Map and Array instances are bound to MobX objects and arrays, respectively.
 */
export function bindYjsToMobxNode<T extends object>({
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
   * The bound MobX node.
   */
  mobxNode: T

  /**
   * Disposes the binding.
   */
  dispose: () => void
} {
  yjsOrigin = yjsOrigin ?? Symbol("mobx-node-yjs-origin")

  const mobxNode = createMobxNodeFromYjsObject<T>(yjsObject)

  const yjsReplicatingRef = { current: 0 }

  const yjsToMobxNodeReplicationAdmin = setupYjsToMobxNodeReplication({
    mobxNode: mobxNode,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  const mobxNodeToYjsReplicationAdmin = setupMobxNodeToYjsReplication({
    mobxNode: mobxNode,
    yjsDoc,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  return {
    mobxNode,

    dispose: () => {
      mobxNodeToYjsReplicationAdmin.dispose()
      yjsToMobxNodeReplicationAdmin.dispose()
    },
  }
}
