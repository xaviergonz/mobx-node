/**
 * A function for disposing resources.
 */
export type Dispose<A extends any[] = []> = (...args: A) => void

/**
 * Wraps a function to ensure it is only executed once.
 *
 * @param fn - The function to be executed only once.
 * @returns A new function that calls the original function only the first time it is invoked.
 */
export function disposeOnce<A extends any[]>(fn: (...args: A) => void): Dispose<A> {
  let disposed = false

  return (...args: A) => {
    if (disposed) {
      return
    }
    disposed = true

    fn(...args)
  }
}

/**
 * Represents a disposable object that implements the Dispose interface and the Symbol.dispose method.
 *
 * This type is used to define objects that can be properly disposed of both manually via a `.dispose()` method
 * and automatically when used with the ECMAScript `using` statement or `using` declarations.
 *
 * @see Dispose
 */
export type DisposableDispose = Dispose & Disposable

/**
 * Enhances a disposer function to be compatible with the ECMAScript "using" statement.
 *
 * @param disposer The original disposer function
 * @returns The enhanced disposer with Symbol.dispose protocol support
 */
export function makeDisposable(disposer: Dispose, once = true): DisposableDispose {
  if (typeof disposer !== "function") {
    throw new Error("Expected a function")
  }

  const disposableDisposer = once ? disposeOnce(disposer) : disposer
  ;(disposableDisposer as any)[Symbol.dispose] = () => disposableDisposer()

  return disposableDisposer as DisposableDispose
}
