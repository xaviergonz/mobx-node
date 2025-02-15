import { action } from "mobx"
import { getSnapshot } from "mobx-bonsai"
import { getSnapshot as mstGetSnapshot } from "mobx-state-tree"
import { bench, ExtrasToRun } from "./bench.js"
import { ESBigModel } from "./models/es6.js"
import { createBigModel, setA, setters } from "./models/mobxBonsai.js"
import { MobxBigModel } from "./models/mobx.js"
import { mstBigModel } from "./models/mst.js"
import { sleep } from "./sleep.js"

const extrasToRun: ExtrasToRun = [
  // "es6",
  // "mobx",
]

const waitBetweenBenchmarks = () => sleep(1000)

const name = "non type checked props"

bench(
  `empty creation (${name})`,
  () => {
    createBigModel({})
  },
  () => {
    mstBigModel.create({})
  },
  () => {
    new ESBigModel({})
  },
  () => {
    new MobxBigModel({})
  },
  extrasToRun
)
await waitBetweenBenchmarks()

const bigModelBigVars = ["aa", "bb", "cc", "dd"] as const
const bigModelSmallVars = ["a", "b", "c", "d"] as const
const smallModelVars = ["a", "b", "c", "d"] as const

const accessVars = (x: any) => {
  bigModelBigVars.forEach((bmbv) => {
    const small = x[bmbv]
    smallModelVars.forEach((smv) => {
      void small[smv]
    })
  })
  bigModelSmallVars.forEach((bmsv) => {
    void x[bmsv]
  })
}

bench(
  `empty creation + access all simple props (${name})`,
  () => {
    const x = createBigModel({})
    accessVars(x)
  },
  () => {
    const x = mstBigModel.create({})
    accessVars(x)
  },
  () => {
    const x = new ESBigModel({})
    accessVars(x)
  },
  () => {
    const x = new MobxBigModel({})
    accessVars(x)
  },
  extrasToRun
)
await waitBetweenBenchmarks()

{
  const bm1 = createBigModel({})
  const bm2 = mstBigModel.create({})
  const bm3 = new ESBigModel({})
  const bm4 = new MobxBigModel({})

  bench(
    `already created, access all simple props (${name})`,
    () => {
      accessVars(bm1)
    },
    () => {
      accessVars(bm2)
    },
    () => {
      accessVars(bm3)
    },
    () => {
      accessVars(bm4)
    },
    extrasToRun
  )
  await waitBetweenBenchmarks()
}

{
  const bigModelSnapshot = {
    a: "a value",
    b: "b value",
    c: "c value",
    d: "d value",
    aa: {
      a: "aa a value",
      b: "aa b value",
      c: "aa c value",
      d: "aa d value",
    },
    bb: {
      a: "bb a value",
      b: "bb b value",
      c: "bb c value",
      d: "bb d value",
    },
    cc: {
      a: "cc a value",
      b: "cc b value",
      c: "cc c value",
      d: "cc d value",
    },
    dd: {
      a: "dd a value",
      b: "dd b value",
      c: "dd c value",
      d: "dd d value",
    },
  }

  bench(
    `snapshot creation (${name})`,
    () => {
      createBigModel(bigModelSnapshot)
    },
    () => {
      mstBigModel.create(bigModelSnapshot)
    },
    () => {
      ESBigModel.fromSnapshot(bigModelSnapshot)
    },
    () => {
      MobxBigModel.fromSnapshot(bigModelSnapshot)
    },
    extrasToRun
  )
  await waitBetweenBenchmarks()
}

const setVarsMobxBonsai = action((x: any) => {
  bigModelBigVars.forEach((bmbv) => {
    const small = x[bmbv]
    smallModelVars.forEach((smv) => {
      ;(setters as any)["set" + smv.toUpperCase()](small, small[smv] + "x")
    })
  })
  bigModelSmallVars.forEach((bmsv) => {
    ;(setters as any)["set" + bmsv.toUpperCase()](x, x[bmsv] + "x")
  })
})

const setVars = action((x: any) => {
  bigModelBigVars.forEach((bmbv) => {
    const small = x[bmbv]
    smallModelVars.forEach((smv) => {
      small["set" + smv.toUpperCase()](small[smv] + "x")
    })
  })
  bigModelSmallVars.forEach((bmsv) => {
    x["set" + bmsv.toUpperCase()](x[bmsv] + "x")
  })
})

{
  const bm1 = createBigModel({})
  const bm2 = mstBigModel.create({})
  const bm3 = mstBigModel.create({})
  const bm4 = mstBigModel.create({})

  bench(
    `already created, change all simple props (${name})`,
    () => {
      setVarsMobxBonsai(bm1)
    },
    () => {
      setVars(bm2)
    },
    () => {
      setVars(bm3)
    },
    () => {
      setVars(bm4)
    },
    extrasToRun
  )
  await waitBetweenBenchmarks()
}

{
  const bm1 = createBigModel({})
  const bm2 = mstBigModel.create({})
  const bm3 = new ESBigModel({})
  const bm4 = new MobxBigModel({})

  bench(
    `already created, change one simple props + getSnapshot (${name})`,
    () => {
      setA(bm1, bm1.a + "x")
      getSnapshot(bm1)
    },
    () => {
      bm2.setA(bm2.a + "x")
      mstGetSnapshot(bm2)
    },
    () => {
      bm3.setA(bm3.a + "x")
      bm3.toJSON()
    },
    () => {
      bm4.setA(bm4.a + "x")
      bm4.toJSON()
    },
    extrasToRun
  )
  await waitBetweenBenchmarks()
}
