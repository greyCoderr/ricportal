import type { Logger } from "pino";
import { createApp } from "./app.js";
import { EnvError, parseEnv, type Env } from "./config/env.js";
import { createLogger } from "./core/logger.js";

function exitAfterFlush(logger: Logger, code: number): void {
  process.exitCode = code;
  logger.flush(() => {
    process.exit();
  });
}

function main(): void {
  let env: Env;
  try {
    env = parseEnv(process.env);
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const logger = createLogger(env);
  const app = createApp({ logger, config: env });

  const server = app.listen(env.PORT, (error?: Error) => {
    if (error) {
      logger.fatal({ err: error }, "server failed to start");
      exitAfterFlush(logger, 1);
      return;
    }
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "server listening");
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, "shutting down");
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, "server close failed");
      }
      exitAfterFlush(logger, error ? 1 : 0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
