import * as Y from "yjs"
import {
  YjsValue,
  applyPlainArrayToYArray,
  applyPlainObjectToYMap,
  bindYjsToMobxNode,
} from "../src"

const disposers: (() => void)[] = []

export function createObjectTestbed<T extends Record<string, any>>(initialData: T) {
  const yjsDoc = new Y.Doc()
  const yjsObject = yjsDoc.getMap("data") as Y.Map<YjsValue>
  applyPlainObjectToYMap(yjsObject, initialData)

  const { mobxNode: mobxObservable, dispose } = bindYjsToMobxNode<T>({
    yjsDoc: yjsDoc,
    yjsObject: yjsObject,
  })

  disposers.push(dispose)

  return { mobxObservable, yjsDoc, yjsObject }
}

export function createArrayTestbed<T extends any[]>(initialData: T) {
  const yjsDoc = new Y.Doc()
  const yjsObject = yjsDoc.getArray("data") as Y.Array<YjsValue>
  applyPlainArrayToYArray(yjsObject, initialData)

  const { mobxNode: mobxObservable, dispose } = bindYjsToMobxNode<T>({
    yjsDoc: yjsDoc,
    yjsObject: yjsObject,
  })

  disposers.push(dispose)

  return { mobxObservable, yjsDoc, yjsObject }
}

afterEach(() => {
  disposers.forEach((dispose) => dispose())
  disposers.length = 0
})
