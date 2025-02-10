import * as Y from "yjs"
import { PlainObject, YjsValue, applyPlainObjectToYMap, bindYjsToMobxObservable } from "../src"

const disposers: (() => void)[] = []

export function createTestbed<T extends PlainObject>(initialData: T) {
  const yjsDoc = new Y.Doc()
  const yjsObject = yjsDoc.getMap("data") as Y.Map<YjsValue>
  applyPlainObjectToYMap(yjsObject, initialData)

  const { mobxObservable, dispose } = bindYjsToMobxObservable<T>({
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
