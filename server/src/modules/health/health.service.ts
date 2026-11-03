import type { Logger } from "pino";
import { HEALTH_TIMEOUT_MS } from "../../config/limits.js";
import { ServiceUnavailableError } from "../../core/errors.js";
import type { HealthRepository } from "./health.repository.js";
import type { HealthStatus } from "./health.schemas.js";

export type HealthService = {
  check(): Promise<HealthStatus>;
};

export type HealthServiceDeps = {
  repository: HealthRepository;
  logger: Logger;
  timeoutMs?: number | undefined;
  now?: () => Date;
};

class HealthTimeoutError extends Error {
  readonly code = "timeout";
}

// Only the driver's error code is logged: driver messages can contain the
// host, user or database name.
function errorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return error instanceof Error ? error.name : "unknown";
}

export function createHealthService(deps: HealthServiceDeps): HealthService {
  const timeoutMs = deps.timeoutMs ?? HEALTH_TIMEOUT_MS;
  const now = deps.now ?? (() => new Date());

  return {
    async check() {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new HealthTimeoutError());
        }, timeoutMs);
      });

      try {
        await Promise.race([deps.repository.ping(), timeout]);
      } catch (error) {
        deps.logger.warn(
          { code: errorCode(error) },
          "health check: database down",
        );
        throw new ServiceUnavailableError();
      } finally {
        clearTimeout(timer);
      }

      return { status: "ok", db: "up", time: now().toISOString() };
    },
  };
}
