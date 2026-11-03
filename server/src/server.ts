import type { Logger } from "pino";
import { createApp } from "./app.js";
import { EnvError, parseEnv, type Env } from "./config/env.js";
import { createPrismaClient, DatabaseUrlError } from "./core/db.js";
import { createLogger } from "./core/logger.js";
import { createHealthRepository } from "./modules/health/health.repository.js";

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
  let prisma: ReturnType<typeof createPrismaClient>;
  try {
    prisma = createPrismaClient(env.DATABASE_URL);
  } catch (error) {
    if (error instanceof DatabaseUrlError) {
      process.stderr.write(`${error.message}
`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const app = createApp({
    logger,
    config: env,
    health: { repository: createHealthRepository(prisma) },
  });

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
      prisma.$disconnect().then(
        () => {
          exitAfterFlush(logger, error ? 1 : 0);
        },
        () => {
          logger.error("database disconnect failed");
          exitAfterFlush(logger, 1);
        },
      );
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
