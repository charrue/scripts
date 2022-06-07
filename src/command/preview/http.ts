import HTTP, {
  Server as HttpServer,
  OutgoingHttpHeader,
} from "http";
import type { Logger } from "@charrue/toolkit";

export type CorsOrigin = boolean | string | RegExp | (string | RegExp)[]
// https://github.com/expressjs/cors#configuration-options
export interface CorsOptions {
  origin?:
  | CorsOrigin
  | ((origin: string, cb: (err: Error, origins: CorsOrigin) => void) => void)
  methods?: string | string[]
  allowedHeaders?: string | string[]
  exposedHeaders?: string | string[]
  credentials?: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export interface CommonServerOptions {
  port?: number;
  strictPort?: boolean;
  host?: string | boolean;
  open?: boolean | string;
  cors?: CorsOptions | boolean
  headers?: OutgoingHttpHeader
}

export const createHttpServer = (app: any) => HTTP.createServer(app);

/**
 * 启动 http 服务器
 * 返回端口号
 */
export const httpServerStart = (
  httpServer: HttpServer,
  serverOptions: {
    port: number
    strictPort: boolean | undefined
    host: string | undefined
    logger: Logger
  },
): Promise<number> => new Promise((resolve, reject) => {
  const {
    port,
    strictPort,
    host,
    logger,
  } = serverOptions;

  const onError = (e: Error & { code?: string }) => {
    if (e.code === "EADDRINUSE") {
      // 如果设置`strictPort`为true，并且端口被占用，则抛出错误，终止服务
      // 否则会尝试使用下一个可用端口
      if (strictPort) {
        httpServer.removeListener("error", onError);
        reject(new Error(`Port ${port} is already in use`));
      } else {
        logger.info(`Port ${port} is in use, trying another one...`);
        httpServer.listen(port + 1, host);
      }
    } else {
      httpServer.removeListener("error", onError);
      reject(e);
    }
  };

  httpServer.on("error", onError);
  httpServer.listen(port, host, () => {
    httpServer.removeListener("error", onError);
    resolve(port);
  });
});

export const resolveHostname = (optionsHost: string | boolean | undefined) => {
  // eslint-disable-next-line init-declarations
  let host: string | undefined;
  if (optionsHost === undefined || optionsHost === false) {
    host = "127.0.0.1";
  } else if (optionsHost === true) {
    host = undefined;
  } else {
    host = optionsHost;
  }

  const name = (optionsHost !== "127.0.0.1" && host === "127.0.0.1")
    || host === "0.0.0.0"
    || host === "::"
    || host === undefined
    ? "localhost"
    : host;

  return { host, name };
};
