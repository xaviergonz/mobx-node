/**
 * Utility type that accepts either the original type or a readonly array if the type is an array
 */
export type ReadonlyArrayCompatible<T> = T extends any[] ? readonly T[number][] : T
