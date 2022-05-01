#!/usr/bin/env node

import cac from "cac";
import { initCommitLintPreset } from "./command/preset/commitlint";
import type { PreviewOptions } from "./command/preview";
import { preview } from "./command/preview/index";

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
      initCommitLintPreset({ cwd });
    }
  });

cli.help();

cli.version(require("../package.json").version);

cli.parse();
