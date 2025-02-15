/**
 * A mobx-bonsai error.
 */
export class MobxBonsaiError extends Error {
  constructor(msg: string) {
    super(msg)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MobxBonsaiError.prototype)
  }
}
