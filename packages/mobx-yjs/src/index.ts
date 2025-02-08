import * as Y from "yjs";

/**
 * Creates a bidirectional binding between a Y.js data structure and a mobx-keystone model.
 */
export function bindYjsToMobxObservable<T>({
  yjsDoc,
  yjsObject,
  yjsOrigin,
}: {
  /**
   * The Y.js document.
   */
  yjsDoc: Y.Doc;

  /**
   * The bound Y.js data structure.
   */
  yjsObject: Y.Map<unknown> | Y.Array<unknown> | Y.Text;

  /**
   * The Y.js origin symbol used for binding transactions.
   */
  yjsOrigin?: symbol;
}): {
  /**
   * The bound mobx observable instance.
   */
  mobxObservable: T;

  /**
   * Disposes the binding.
   */
  dispose: () => void;
} {
  // TODO: implement
  return 0 as any;
}
