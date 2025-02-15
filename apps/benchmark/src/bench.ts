import Benchmark from "benchmark"
import chalk from "chalk"

export type ExtrasToRun = ("es6" | "mobx")[]

export function bench(
  name: string,
  mobxBonsaiImpl: Function,
  mstImpl: Function,
  es6Impl: Function,
  mobxImpl: Function,
  extrasToRun: ExtrasToRun
) {
  let suite = new Benchmark.Suite(name)

  let results: Record<string, Benchmark.Target> = {}

  const mobxBonsai = chalk.green("mobx-bonsai")
  const mst = chalk.red("mobx-state-tree")
  const es6 = chalk.magenta("raw es6")
  const mobx = chalk.blue("raw mobx")

  suite = suite.add(mobxBonsai, mobxBonsaiImpl)

  const runMst = true
  if (runMst) {
    suite = suite.add(mst, mstImpl)
  }

  if (extrasToRun.includes("mobx")) {
    suite = suite.add(mobx, mobxImpl)
  }
  if (extrasToRun.includes("es6")) {
    suite = suite.add(es6, es6Impl)
  }

  // add listeners
  suite
    .on("error", (error: any) => {
      console.error(error)
    })
    .on("start", () => {
      console.log(chalk.cyan(name))
      results = {}
    })
    .on("cycle", (event: Benchmark.Event) => {
      results[event.target.name!] = event.target
      console.log(String(event.target))
    })
    .on("complete", () => {
      if (runMst) {
        const mobxBonsaiSpeed = results[mobxBonsai].hz!
        const mstSpeed = results[mst].hz!
        const fastest = mobxBonsaiSpeed > mstSpeed ? mobxBonsai : mst

        const ratio = Math.max(mobxBonsaiSpeed, mstSpeed) / Math.min(mobxBonsaiSpeed, mstSpeed)

        console.log(
          `Fastest between mobx-bonsai and mobx-state-tree is ${fastest} by ${ratio.toFixed(2)}x`
        )
      }

      if (extrasToRun.includes("mobx")) {
        const mobxRatio = results[mobx].hz! / results[mobxBonsai].hz!
        console.log(`${mobx} is faster than mobx-bonsai by ${mobxRatio.toFixed(2)}x`)
      }

      if (extrasToRun.includes("es6")) {
        const es6Ratio = results[es6].hz! / results[mobxBonsai].hz!
        console.log(`${es6} is faster than mobx-bonsai by ${es6Ratio.toFixed(2)}x`)
      }

      console.log()
    })
    .run({ async: false })
}
