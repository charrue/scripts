/* eslint-disable @typescript-eslint/no-unused-vars */

import cac from "cac";
import { useCommitLintPreset } from "./command/preset/commitlint";
import { useNpmPublishPreset } from "./command/preset/npm-publish";
import type { PreviewOptions } from "./command/preview";
import { preview } from "./command/preview/index";
import { startRelease } from "./command/release";
import { getUserConfig } from "./config";

const cli = cac("petros");

cli.command("preview [dist]", "locally preview production build")
  .option("--port <port>", "Port to run the server on")
  .option("--host <host>", "Host to run the server on")
  .option("--base <base>", "Base url to serve")
  .option("--open", "Open the browser")
  .option("--strictPort", "Strict port checking")
  .action(async (dist = "./dist", {
    port,
    host,
    open,
    strictPort,
    base,
  }) => {
    const cwd = process.cwd();
    const previewOptions: PreviewOptions = {
      open,
      port: port ?? 5555,
      host,
      base: base ?? "/",
      outDir: dist,
      strictPort,
      root: cwd,
    };

    await preview(previewOptions);
  });

cli.command("preset [type]", "add preset to your project")
  .action((presetType: string) => {
    const cwd = process.cwd();
    if (presetType === "commitlint") {
      useCommitLintPreset({ cwd });
    }
    if (presetType === "npm-publish") {
      useNpmPublishPreset({ cwd });
    }
  });

cli.command("release [version]", "release your project")
  .action(async (version: string) => {
    const cwd = process.cwd();
    const userConfig = await getUserConfig();

    await startRelease({ cwd, version }, userConfig);
  });

cli.help();

cli.version(require("../package.json").version);

cli.parse();
