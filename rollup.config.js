import path from "path";
import rimraf from "rimraf";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonJs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

const commonPlugins = [
  esbuild({
    target: "es2015",
  }),
  nodeResolve(),
  commonJs({
    ignoreDynamicRequires: true,
  }),
  json(),
];

const getOutput = (filename) => path.resolve(__dirname, "./dist", filename);

const externals = ["esbuild", "zlib"];

const config = [
  // 将node模块的文件单独打包
  {
    input: path.resolve(__dirname, "./src/cli.ts"),
    output: {
      file: getOutput("cli.js"),
      format: "cjs",
    },
    external: externals,
    plugins: commonPlugins,
  },
  {
    input: path.resolve(__dirname, "./src/cli.ts"),
    output: [
      {
        format: "es",
        file: getOutput("cli.d.ts"),
      },
    ],
    plugins: [ dts() ],
  },
];

rimraf.sync("./dist");
export default config;
