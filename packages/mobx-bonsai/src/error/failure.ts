import { MobxBonsaiError } from "./MobxBonsaiError"

/**
 * @internal
 */
export function failure(msg: string) {
  return new MobxBonsaiError(msg)
}
