import { MobxNodeError } from "./MobxNodeError"

/**
 * @internal
 */
export function failure(msg: string) {
  return new MobxNodeError(msg)
}
