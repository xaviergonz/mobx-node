/**
 * A mobx-yjs error.
 */
export class MobxYjsError extends Error {
  constructor(msg: string) {
    super(msg)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MobxYjsError.prototype)
  }
}
