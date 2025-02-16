import { isObservableArray, runInAction } from "mobx"
import { failure } from "../error/failure"

class PlainArraySet<T> implements Set<T> {
  constructor(private readonly data: T[]) {}

  add(value: T): this {
    if (!this.has(value)) {
      this.data.push(value)
    }
    return this
  }

  clear(): void {
    this.data.length = 0
  }

  delete(value: T): boolean {
    const index = this.data.indexOf(value)
    if (index >= 0) {
      this.data.splice(index, 1)
      return true
    }
    return false
  }

  has(value: T): boolean {
    return this.data.indexOf(value) !== -1
  }

  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
    for (const v of this.data) {
      callbackfn.call(thisArg, v, v, this)
    }
  }

  get size(): number {
    return this.data.length
  }

  *entries(): ReturnType<Set<T>["entries"]> {
    for (const v of this.data) {
      yield [v, v]
    }
  }

  *keys(): ReturnType<Set<T>["keys"]> {
    yield* this.data
  }

  *values(): ReturnType<Set<T>["values"]> {
    yield* this.data
  }

  [Symbol.iterator](): ReturnType<Set<T>[typeof Symbol.iterator]> {
    return this.values()
  }

  readonly [Symbol.toStringTag] = "PlainArraySet"

  union<U>(other: ReadonlySetLike<U>): Set<T | U> {
    const s = new Set(this)
    return s.union(other)
  }

  intersection<U>(other: ReadonlySetLike<U>): Set<T & U> {
    const s = new Set(this)
    return s.intersection(other)
  }

  difference<U>(other: ReadonlySetLike<U>): Set<T> {
    const s = new Set(this)
    return s.difference(other)
  }

  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U> {
    const s = new Set(this)
    return s.symmetricDifference(other)
  }

  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSubsetOf(other)
  }

  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSupersetOf(other)
  }

  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isDisjointFrom(other)
  }
}

class ObservableArraySet<T> implements Set<T> {
  constructor(private readonly data: T[]) {}

  add(value: T): this {
    runInAction(() => {
      if (!this.has(value)) {
        this.data.push(value)
      }
    })
    return this
  }

  clear(): void {
    runInAction(() => {
      this.data.length = 0
    })
  }

  delete(value: T): boolean {
    let deleted = false
    runInAction(() => {
      const index = this.data.indexOf(value)
      if (index >= 0) {
        this.data.splice(index, 1)
        deleted = true
      }
    })
    return deleted
  }

  has(value: T): boolean {
    return this.data.indexOf(value) !== -1
  }

  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
    for (const v of this.data.slice()) {
      callbackfn.call(thisArg, v, v, this)
    }
  }

  get size(): number {
    return this.data.length
  }

  *entries(): ReturnType<Set<T>["entries"]> {
    for (const v of this.data) {
      yield [v, v]
    }
  }

  *keys(): ReturnType<Set<T>["keys"]> {
    yield* this.data
  }

  *values(): ReturnType<Set<T>["values"]> {
    yield* this.data
  }

  [Symbol.iterator](): ReturnType<Set<T>[typeof Symbol.iterator]> {
    return this.values()
  }

  readonly [Symbol.toStringTag] = "ObservableArraySet"

  union<U>(other: ReadonlySetLike<U>): Set<T | U> {
    const s = new Set(this)
    return s.union(other)
  }

  intersection<U>(other: ReadonlySetLike<U>): Set<T & U> {
    const s = new Set(this)
    return s.intersection(other)
  }

  difference<U>(other: ReadonlySetLike<U>): Set<T> {
    const s = new Set(this)
    return s.difference(other)
  }

  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U> {
    const s = new Set(this)
    return s.symmetricDifference(other)
  }

  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSubsetOf(other)
  }

  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isSupersetOf(other)
  }

  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    const s = new Set(this)
    return s.isDisjointFrom(other)
  }
}

const setCache = new WeakMap<any[], Set<any>>()

/**
 * Returns a Set-like view of the given array.
 *
 * For plain arrays, the set interface is backed by the array,
 * ensuring values appear only once. For observable arrays, mutations
 * are wrapped in actions using MobX.
 *
 * @template T The type of the values.
 * @param data An array to be wrapped as a Set.
 * @returns A Set-like view over the array.
 * @throws When data is not an array.
 */
export function asSet<T>(data: T[]): Set<T> {
  if (!(Array.isArray(data) || isObservableArray(data))) {
    throw failure("asSet expects an array")
  }

  let setInstance = setCache.get(data)
  if (!setInstance) {
    setInstance = isObservableArray(data)
      ? new ObservableArraySet<T>(data)
      : new PlainArraySet<T>(data)
    setCache.set(data, setInstance)
  }
  return setInstance
}
