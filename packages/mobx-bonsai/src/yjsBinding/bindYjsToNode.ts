import * as Y from "yjs"
import { setupNodeToYjsReplication } from "./nodeToYjs/setupNodeToYjsReplication"
import { createNodeFromYjsObject } from "./yjsToNode/createNodeFromYjsObject"
import { setupYjsToNodeReplication } from "./yjsToNode/setupYjsToNodeReplication"
import { YjsStructure } from "./yjsTypes/types"

/**
 * Creates a node that is bound to a Y.js data structure.
 * Y.js Map and Array instances are bound to MobX objects and arrays, respectively.
 */
export function bindYjsToNode<T extends object>({
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
   * The bound node.
   */
  node: T

  /**
   * Disposes the binding.
   */
  dispose: () => void
} {
  yjsOrigin = yjsOrigin ?? Symbol("mobx-bonsai-yjs-origin")

  const node = createNodeFromYjsObject<T>(yjsObject)

  const yjsReplicatingRef = { current: 0 }

  const yjsToNodeReplicationAdmin = setupYjsToNodeReplication({
    node: node,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  const nodeToYjsReplicationAdmin = setupNodeToYjsReplication({
    node: node,
    yjsDoc,
    yjsObject,
    yjsOrigin,
    yjsReplicatingRef,
  })

  return {
    node: node,

    dispose: () => {
      nodeToYjsReplicationAdmin.dispose()
      yjsToNodeReplicationAdmin.dispose()
    },
  }
}
