/* eslint-disable no-useless-escape */
/* eslint-disable max-statements */
/**
 * 在当前项目下添加 commitlint 相关配置，包括npm依赖，husky配置，commitlint配置
 */
import {
  existsSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { resolve } from "path";
import { findUp, exec } from "@charrue/toolkit/dist/node";
import { colorizeMessage } from "@charrue/toolkit";

interface CommitLintPresetConfig {
  cwd: string
}

const commitMessageHook = `#!/bin/sh
. "\$(dirname "\$0")/_/husky.sh"

npx --no -- commitlint --edit "\${1}"`;

export const initCommitLintPreset = (options: CommitLintPresetConfig) => {
  const { cwd } = options;
  const packageJsonPath = findUp("package.json", {
    cwd,
    type: "file",
  });
  const rootPath = resolve(cwd, "..");
  const huskyDir = resolve(rootPath, "husky");
  const commitlintConfigFilePath = resolve(rootPath, "commitlint.config.js");
  // 1. 添加 commitlint 配置
  exec(`npm set-script changelog "conventional-changelog -p angular -i CHANGELOG.md -s"`);

  if (!existsSync(commitlintConfigFilePath)) {
    writeFileSync(
      commitlintConfigFilePath,
      `module.exports = {extends: ['@commitlint/config-conventional']}`,
      {
        encoding: "utf-8",
      },
    );
  }

  // 2. 添加 husky 配置
  exec(`npm set-script prepare "husky install"`);
  if (!existsSync(huskyDir)) {
    mkdirSync(huskyDir);
  }
  writeFileSync(
    resolve(huskyDir, "commit-msg"),
    commitMessageHook,
    {
      encoding: "utf-8",
    },
  );

  // 3. package.json写入依赖项
  const packageJSON = require(packageJsonPath);
  if (!packageJSON.devDependencies) {
    packageJSON.devDependencies = {};
  }
  packageJSON.devDependencies = {
    ...packageJSON.devDependencies,
    "@commitlint/cli": "^16.2.4",
    "@commitlint/config-conventional": "^16.2.4",
    commitizen: "^4.2.4",
    "conventional-changelog-cli": "^2.2.2",
    husky: "^7.0.4",
  };
  packageJSON.config = {
    commitizen: {
      path: "./node_modules/cz-conventional-changelog",
    },
  };
  writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJSON, null, 2),
  );

  // 4. package.json格式美化
  console.log(colorizeMessage("sort package.json task start ...", "info"));
  exec("npx sort-package-json");
  console.log(colorizeMessage("sort package.json task end !", "info"));
};
