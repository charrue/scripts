import {
  existsSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { resolve } from "path";
import { findUp } from "@charrue/toolkit/dist/node";
import { colorizeMessage } from "@charrue/toolkit";

const githubActionContent = `name: Publish Package to npmjs

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install pnpm
        uses: pnpm/action-setup@v2.0.1
        with:
          version: 6.15.1

      - name: Set node version to 16
        uses: actions/setup-node@v3
        with:
          node-version: 16
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm publish --access=public
        env:
          NODE_AUTH_TOKEN: $\{\{ secrets.NPM_TOKEN \}\}`;

export const useNpmPublishPreset = ({ cwd }: { cwd: string }) => {
  const root = resolve(
    findUp("package.json", {
      cwd,
      type: "file",
    }),
    "..",
  );

  const githubDir = resolve(root, ".github");
  if (!existsSync(githubDir)) {
    mkdirSync(githubDir);
  }
  const workflowDir = resolve(githubDir, "workflows");
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir);
  }
  const workflowFilePath = resolve(workflowDir, "publish.yml");
  if (!existsSync(workflowFilePath)) {
    writeFileSync(
      workflowDir,
      githubActionContent,
      { encoding: "utf-8" },
    );
  }

  console.log(colorizeMessage("publish.yml已配置完成, 请为仓库配置的 NPM_TOKEN secret", "info"));
};
