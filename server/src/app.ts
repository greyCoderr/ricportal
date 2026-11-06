import express, { type Express } from "express";
import type { Logger } from "pino";
import { buildApiMounts } from "./api.js";
import type { AppConfig } from "./config/app-config.js";
import { createErrorHandler } from "./core/middleware/error-handler.js";
import { notFound } from "./core/middleware/not-found.js";
import { applyRequestPipeline } from "./core/middleware/pipeline.js";
import { requestId } from "./core/middleware/request-id.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import type { HealthRepository } from "./modules/health/health.repository.js";

export type AppDeps = {
  logger: Logger;
  config: AppConfig;
  // Injected so tests can stub the database (server.ts passes the real one).
  health: { repository: HealthRepository; timeoutMs?: number | undefined };
  // The database for every module. Tests of the pipeline leave it out and get
  // only the health route.
  prisma?: PrismaClient | undefined;
  // The clock, so tests can move time (lockout, session expiry).
  now?: (() => Date) | undefined;
  // The built client (client/dist). When set, Express serves it on the same
  // port with a fallback to index.html for non-API paths.
  clientDist?: string | undefined;
};

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(requestId);
  applyRequestPipeline(app, deps.config);

  for (const mount of buildApiMounts({
    logger: deps.logger,
    config: deps.config,
    health: deps.health,
    prisma: deps.prisma,
    now: deps.now ?? (() => new Date()),
  })) {
    app.use(mount.path, mount.router);
  }

  const clientDist = deps.clientDist;
  if (clientDist !== undefined) {
    app.use(express.static(clientDist));
    app.get("/{*splat}", (req, res, next) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile("index.html", { root: clientDist });
    });
  }

  app.use(notFound);
  app.use(createErrorHandler(deps.logger));

  return app;
}
