import { MobxBonsaiError } from "./MobxBonsaiError"

export function failure(msg: string) {
  return new MobxBonsaiError(msg)
}
