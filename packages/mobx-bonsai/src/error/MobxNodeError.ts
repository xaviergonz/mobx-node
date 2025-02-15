/**
 * A mobx-node error.
 */
export class MobxNodeError extends Error {
  constructor(msg: string) {
    super(msg)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MobxNodeError.prototype)
  }
}
