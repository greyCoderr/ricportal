import express, { type Express } from "express";
import type { Logger } from "pino";
import type { AppConfig } from "./config/app-config.js";
import { createErrorHandler } from "./core/middleware/error-handler.js";
import { notFound } from "./core/middleware/not-found.js";
import { applyRequestPipeline } from "./core/middleware/pipeline.js";
import { requestId } from "./core/middleware/request-id.js";
import { createHealthController } from "./modules/health/health.controller.js";
import type { HealthRepository } from "./modules/health/health.repository.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createHealthService } from "./modules/health/health.service.js";

export type AppDeps = {
  logger: Logger;
  config: AppConfig;
  // Injected so tests can stub the database (server.ts passes the real one).
  health: { repository: HealthRepository; timeoutMs?: number | undefined };
  // The built client (client/dist). When set, Express serves it on the same
  // port with a fallback to index.html for non-API paths.
  clientDist?: string | undefined;
};

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(requestId);
  applyRequestPipeline(app, deps.config);

  const healthService = createHealthService({
    repository: deps.health.repository,
    logger: deps.logger,
    timeoutMs: deps.health.timeoutMs,
  });
  app.use(
    "/api/health",
    createHealthRouter(createHealthController(healthService)),
  );

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
