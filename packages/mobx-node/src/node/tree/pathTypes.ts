/**
 * Property name (if the parent is an object) or index number (if the parent is an array).
 */
export type PathElement = string

/**
 * Path from a parent to a child.
 */
export type Path = ReadonlyArray<PathElement>

/**
 * Path from a parent to a child (writable).
 */
export type WritablePath = PathElement[]
