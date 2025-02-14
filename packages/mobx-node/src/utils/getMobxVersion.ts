import * as mobx from "mobx"

const mobx6 = {
  makeObservable: (mobx as any)[
    // just to ensure import * is kept properly
    String.fromCharCode("l".charCodeAt(0) + 1) + "akeObservable"
  ],
}

/**
 * @internal
 */
export function getMobxVersion(): number {
  if (mobx6.makeObservable!) {
    return 6
  } else {
    return 5
  }
}
