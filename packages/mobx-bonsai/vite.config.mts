import path from "path"
import typescript2 from "rollup-plugin-typescript2"
import { defineConfig } from "vite"

const resolvePath = (str: string) => path.resolve(__dirname, str)

export default defineConfig({
  build: {
    target: "node10",
    lib: {
      entry: resolvePath("./src/index.ts"),
      name: "mobx-node",
    },
    sourcemap: "inline",
    minify: false,

    rollupOptions: {
      external: ["mobx"],

      output: [
        {
          format: "esm",
          entryFileNames: "mobx-node.esm.mjs",
        },
        {
          name: "mobx-node",
          format: "umd",
          globals: {
            mobx: "mobx",
          },
        },
      ],
    },
  },
  plugins: [
    {
      ...typescript2({
        useTsconfigDeclarationDir: true,
      }),
      enforce: "pre",
    },
  ],
})
