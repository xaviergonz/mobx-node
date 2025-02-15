import { action, computed, makeObservable, observable } from "mobx"
import { computedProp, node } from "mobx-node"

export interface SmallModel {
  a: string
  b: string
  c: string
  d: string
}

export const createSmallModel = (props?: Partial<SmallModel>) => {
  return node({
    a: props?.a ?? "a",
    b: props?.b ?? "b",
    c: props?.c ?? "c",
    d: props?.d ?? "d",
  })
}

export interface BigModel {
  a: string
  b: string
  c: string
  d: string
  aa: SmallModel
  bb: SmallModel
  cc: SmallModel
  dd: SmallModel
}

export const createBigModel = (props: Partial<BigModel>) => {
  return node({
    a: props?.a ?? "a",
    b: props?.b ?? "b",
    c: props?.c ?? "c",
    d: props?.d ?? "d",
    aa: createSmallModel(props?.aa),
    bb: createSmallModel(props?.bb),
    cc: createSmallModel(props?.cc),
    dd: createSmallModel(props?.dd),
  })
}

export const getA2 = computedProp((m: SmallModel | BigModel) => m.a + m.a)
export const getB2 = computedProp((m: SmallModel | BigModel) => m.b + m.b)
export const getC2 = computedProp((m: SmallModel | BigModel) => m.c + m.c)
export const getD2 = computedProp((m: SmallModel | BigModel) => m.d + m.d)

export const getters = {
  getA2,
  getB2,
  getC2,
  getD2,
}

export const setA = action((self: SmallModel, x: string) => {
  self.a = x
})
export const setB = action((self: SmallModel, x: string) => {
  self.b = x
})
export const setC = action((self: SmallModel, x: string) => {
  self.c = x
})
export const setD = action((self: SmallModel, x: string) => {
  self.d = x
})

export const setAA = action((self: BigModel, x: SmallModel) => {
  self.aa = x
})
export const setBB = action((self: BigModel, x: SmallModel) => {
  self.bb = x
})
export const setCC = action((self: BigModel, x: SmallModel) => {
  self.cc = x
})
export const setDD = action((self: BigModel, x: SmallModel) => {
  self.dd = x
})

export const setters = {
  setA,
  setB,
  setC,
  setD,
  setAA,
  setBB,
  setCC,
  setDD,
}
