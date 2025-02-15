import type { Config } from "jest";

import { mobxVersion } from "./env";

const tsconfigFiles = {
  6: "tsconfig.json",
  5: "tsconfig.mobx5.json",
  4: "tsconfig.mobx4.json",
};

const mobxModuleNames = {
  6: "mobx",
  5: "mobx-v5",
  4: "mobx-v4",
};

const tsconfigFile = tsconfigFiles[mobxVersion];
const mobxModuleName = mobxModuleNames[mobxVersion];

const config: Config = {
  setupFilesAfterEnv: ["./test/commonSetup.ts"],
  moduleNameMapper: {
    "^mobx$": mobxModuleName,
  },
  prettierPath: null,
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: `./test/${tsconfigFile}` }],
  },
};

export default config;
