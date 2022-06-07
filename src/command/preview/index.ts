import { statSync } from "fs";
import { resolve } from "path";
import sirv from "sirv";
import connect from "connect";
import corsMiddleware from "cors";
import openBrowser from "open";
import { createLogger } from "@charrue/toolkit";
import {
  bold, cyan, dim, red,
} from "kolorist";
import type { AddressInfo, Server } from "net";
import os from "os";
import compression from "./compression";
import { createHttpServer, httpServerStart, resolveHostname } from "./http";

export interface PreviewOptions {
  base: string;
  root: string;
  outDir: string;
  port: number;
  open?: boolean | string;
  host?: boolean | string ;
  strictPort?: boolean;
}

const createPreviewService = (base: string, dir: string) => {
  const app = connect();
  app.use(corsMiddleware({}));
  app.use(compression());

  app.use(
    base,
    sirv(dir, {
      etag: true,
      dev: true,
      single: true,
    }),
  );
  const httpServer = createHttpServer(app);
  return httpServer;
};

export const preview = async (config: PreviewOptions) => {
  const {
    base,
    root,
    outDir,
    open,
    host,
    port,
    strictPort,
  } = config;

  let distDir = resolve(root, outDir);

  if (!statSync(distDir).isDirectory()) {
    const distDirParent = resolve(distDir, "..");
    console.warn(`[petros] preview directory ${distDir} should be a directory, but it is not.\nnow set preview directory to ${distDirParent}`);
    distDir = distDirParent;
  }

  const httpServer = createPreviewService(base, distDir);
  const protocol = "http";
  const hostname = resolveHostname(host);
  const logger = createLogger();

  try {
    const serverPort = await httpServerStart(httpServer, {
      port,
      strictPort,
      host: hostname.name,
      logger,
    });

    if (open) {
      const openUrl = typeof open === "string" ? open : base;
      openBrowser(openUrl.startsWith("http")
        ? openUrl
        : `${protocol}://${hostname.name}:${serverPort}${openUrl}`);
    }

    printServerUrls(httpServer, {
      protocol,
      hostname,
      port: serverPort,
      base,
    });
  } catch (e: any) {
    logger.error(red(`error when starting preview server:\n${e.stack}`));
    process.exit(1);
  }
};

export const printServerUrls = (
  server: Server,
  options: {
    protocol: string;
    hostname: { name: string; host?: string; };
    port: number;
    base: string;
  },
) => {
  const {
    protocol,
    hostname,
    port,
    base,
  } = options;
  const address = server.address();
  const isAddressInfo = (x: any): x is AddressInfo => x?.address;

  if (isAddressInfo(address)) {
    if (hostname.host === "127.0.0.1") {
      const url = `${protocol}://${hostname.name}:${bold(port)}${base}`;
      console.log(`  > Local: ${cyan(url)}`);

      if (hostname.name !== "127.0.0.1") {
        console.log(`  > Network: ${dim("use `--host` to expose")}`);
      }
    } else {
      Object.values(os.networkInterfaces())
        .flatMap((nInterface) => nInterface ?? [])
        .filter((detail) => detail && detail.address && detail.family === "IPv4")
        .map((detail) => {
          const type = detail.address.includes("127.0.0.1")
            ? "Local:   "
            : "Network: ";
          const host = detail.address.replace("127.0.0.1", hostname.name);
          const url = `${protocol}://${host}:${bold(port)}${base}`;
          return `  > ${type} ${cyan(url)}`;
        })
        .forEach((msg) => console.log(msg));
    }
  }
};
