import express, { type Express } from "express";
import type { Logger } from "pino";
import type { AppConfig } from "./config/app-config.js";
import { createErrorHandler } from "./core/middleware/error-handler.js";
import { notFound } from "./core/middleware/not-found.js";
import { applyRequestPipeline } from "./core/middleware/pipeline.js";
import { requestId } from "./core/middleware/request-id.js";

export type AppDeps = {
  logger: Logger;
  config: AppConfig;
};

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(requestId);
  applyRequestPipeline(app, deps.config);

  app.use(notFound);
  app.use(createErrorHandler(deps.logger));

  return app;
}
