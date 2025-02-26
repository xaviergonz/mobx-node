import { Dispose } from "../src/utils/disposable"

const disposers: Dispose[] = []

afterEach(() => {
  disposers.forEach((d) => {
    d()
  })
  disposers.length = 0
})

export function autoDispose(disposer: Dispose) {
  disposers.push(disposer)
}

export async function delay(x: number) {
  return new Promise<number>((r) =>
    setTimeout(() => {
      r(x)
    }, x)
  )
}

export function timeMock() {
  const now = Date.now()

  return {
    async advanceTimeTo(x: number) {
      await delay(now + x - Date.now())
    },
  }
}
