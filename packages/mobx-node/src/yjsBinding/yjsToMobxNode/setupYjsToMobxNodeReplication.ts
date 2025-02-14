import { isObservableArray, isObservableObject, remove, runInAction, set } from "mobx"
import * as Y from "yjs"
import { failure } from "../../error/failure"
import { Node } from "../../node/node"
import { resolveNodePath } from "../../node/resolveNodePath"
import { PlainValue } from "../../plainTypes/types"
import { YjsStructure, YjsValue } from "../yjsTypes/types"

function yjsToPlainValue(v: YjsValue): PlainValue {
  if (v instanceof Y.Map || v instanceof Y.Array) {
    return v.toJSON()
  } else {
    return v
  }
}

export function setupYjsToMobxNodeReplication({
  mobxNode,
  yjsObject,
  yjsOrigin,
  yjsReplicatingRef,
}: {
  mobxNode: Node
  yjsObject: YjsStructure
  yjsOrigin: symbol
  yjsReplicatingRef: { current: number }
}) {
  const yjsObserverCallback = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
    if (transaction.origin === yjsOrigin || events.length === 0) {
      return
    }

    // lock to ensure mobx changes don't trigger yjs changes again
    yjsReplicatingRef.current++

    try {
      runInAction(() => {
        events.forEach((event) => {
          const mobxTarget = resolveNodePath(mobxNode, event.path)

          // now y.js and mobx should be in the same target

          if (event instanceof Y.YMapEvent) {
            if (!isObservableObject(mobxTarget)) {
              throw failure("mobx target was expected to be an object")
            }

            const mobxObject = mobxTarget as Node
            const yjsMap = event.target

            event.changes.keys.forEach((change, key) => {
              switch (change.action) {
                case "add":
                case "update":
                  set(mobxObject, key, yjsToPlainValue(yjsMap.get(key)))
                  break

                case "delete":
                  remove(mobxObject, key)
                  break

                default:
                  throw failure(`unsupported Yjs map event action: ${change.action}`)
              }
            })
          } else if (event instanceof Y.YArrayEvent) {
            if (!isObservableArray(mobxTarget)) {
              throw failure("mobx target was expected to be an array")
            }

            const mobxArray = mobxTarget
            let retain = 0

            event.changes.delta.forEach((change) => {
              if (change.retain) {
                retain += change.retain
              }

              if (change.delete) {
                // remove X items at retain position
                mobxArray.splice(retain, change.delete)
              }

              if (change.insert) {
                const newValues = Array.isArray(change.insert) ? change.insert : [change.insert]
                mobxArray.splice(retain, 0, ...newValues.map((v) => yjsToPlainValue(v)))
                retain += newValues.length
              }
            })
          } else {
            throw failure("unsupported Y.js event type")
          }
        })
      })
    } finally {
      yjsReplicatingRef.current--
    }
  }

  yjsObject.observeDeep(yjsObserverCallback)

  return {
    dispose: () => {
      yjsObject.unobserveDeep(yjsObserverCallback)
    },
  }
}
