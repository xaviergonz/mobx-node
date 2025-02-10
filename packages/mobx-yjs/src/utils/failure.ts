import { MobxYjsError } from "./MobxYjsError"

/**
 * @internal
 */
export function failure(msg: string) {
  return new MobxYjsError(msg)
}
