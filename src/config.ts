import { existsSync } from "fs";
import merge from "lodash.merge";
import { loadConfigFromFile, findUp } from "@charrue/toolkit/dist/node";

type CommandOption = boolean | string;

interface ReleaseConfig {
  test?: CommandOption;
  build?: CommandOption;
  changelog?: CommandOption;
  updateLockfile?: boolean;
  saveCommit?: CommandOption;
  publish?: CommandOption;
  push?: CommandOption;
}

export interface PetrosConfig {
  release?: ReleaseConfig;
}

export const defaultPetrosConfig: PetrosConfig = {
  release: {
    test: true,
    build: true,
    changelog: true,
    updateLockfile: true,
    saveCommit: true,
    publish: true,
  },
};

// eslint-disable-next-line init-declarations
let cachedConfig: PetrosConfig | undefined;
/**
 * 加载用户自定义配置
 * 可以识别 petros.config.ts 和 petros.config.js，优先识别petros.config.ts
 */
export const getUserConfig = async () => {
  if (cachedConfig) return cachedConfig;
  let config: PetrosConfig = defaultPetrosConfig;
  const tsConfigFile = findUp("petros.config.ts", { cwd: process.cwd(), type: "file" });
  const jsConfigFile = findUp("petros.config.js", { cwd: process.cwd(), type: "file" });
  const canUseConfigFile = tsConfigFile || jsConfigFile;
  if (existsSync(canUseConfigFile)) {
    const configAndDep = await loadConfigFromFile(canUseConfigFile);
    if (configAndDep) {
      config = merge(defaultPetrosConfig, configAndDep.config || {});
    }
  }

  cachedConfig = config;
  return config;
};
