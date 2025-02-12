import { when } from "mobx"
import * as Y from "yjs"
import { PlainStructure } from "../../plainTypes/types"
import { failure } from "../../utils/failure"
import { FullPath, IChange, mobxDeepObserve } from "./mobxDeepObserve"
import { resolveYjsStructurePath } from "./resolveYjsObjectPath"
import { convertPlainToYjsValue } from "./convertPlainToYjsValue"
import { YjsStructure } from "src/yjsTypes/types"

export function setupMobxToYjsReplication({
  mobxObservable,
  yjsDoc,
  yjsObject,
  yjsOrigin,
  yjsReplicatingRef,
}: {
  mobxObservable: PlainStructure
  yjsDoc: Y.Doc
  yjsObject: YjsStructure
  yjsOrigin: symbol
  yjsReplicatingRef: { current: number }
}) {
  let pendingMobxChanges: {
    change: IChange
    path: FullPath
  }[] = []
  let mobxDeepChangesNestingLevel = 0

  const mobxDeepObserveAdmin = mobxDeepObserve(mobxObservable, (change, path) => {
    // if this comes from a yjs change, ignore it
    if (yjsReplicatingRef.current > 0) {
      return
    }

    mobxDeepChangesNestingLevel++
    pendingMobxChanges.push({ change, path })

    // hack to apply pending mobx changes once all actions and reactions are finished
    when(
      () => true,
      () => {
        mobxDeepChangesNestingLevel--
        if (mobxDeepChangesNestingLevel === 0) {
          yjsDoc.transact(() => {
            const mobxChangesToApply = pendingMobxChanges
            pendingMobxChanges = []
            mobxChangesToApply.forEach(({ change, path }) => {
              const yjsTarget = resolveYjsStructurePath(yjsObject, path)

              // now y.js and mobx should be in the same target

              switch (change.observableKind) {
                case "object": {
                  if (!(yjsTarget instanceof Y.Map)) {
                    throw failure("yjs target was expected to be a map")
                  }
                  const yjsMap = yjsTarget

                  switch (change.type) {
                    case "add":
                    case "update":
                      yjsMap.set(String(change.name), convertPlainToYjsValue(change.newValue))
                      break

                    case "remove":
                      yjsMap.delete(String(change.name))
                      break

                    default:
                      throw failure(`unsupported mobx object change type`)
                  }
                  break
                }

                case "array": {
                  if (!(yjsTarget instanceof Y.Array)) {
                    throw failure("yjs target was expected to be an array")
                  }
                  const yjsArray = yjsTarget

                  switch (change.type) {
                    case "update": {
                      yjsArray.delete(change.index, 1)
                      yjsArray.insert(change.index, [convertPlainToYjsValue(change.newValue)])
                      break
                    }

                    case "splice": {
                      yjsArray.delete(change.index, change.removedCount)
                      yjsArray.insert(change.index, change.added.map(convertPlainToYjsValue))
                      break
                    }

                    default:
                      throw failure(`unsupported mobx array change type`)
                  }
                  break
                }

                default:
                  throw failure(`unsupported mobx change observable kind: ${change.observableKind}`)
              }
            })
          }, yjsOrigin)
        }
      }
    )
  })

  return {
    getParentRef: mobxDeepObserveAdmin.getParentRef,

    dispose: () => {
      mobxDeepObserveAdmin.dispose()
    },
  }
}
