import express, { type Express } from "express";
import type { Logger } from "pino";
import { createErrorHandler } from "./core/middleware/error-handler.js";
import { notFound } from "./core/middleware/not-found.js";
import { requestId } from "./core/middleware/request-id.js";

export type AppDeps = {
  logger: Logger;
};

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.use(requestId);
  app.use(express.json());

  app.use(notFound);
  app.use(createErrorHandler(deps.logger));

  return app;
}
