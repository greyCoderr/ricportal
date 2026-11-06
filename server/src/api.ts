import type { Router } from "express";
import type { Logger } from "pino";
import type { AppConfig } from "./config/app-config.js";
import { createAuthenticate } from "./core/middleware/authenticate.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { createAuthController } from "./modules/auth/auth.controller.js";
import { createAuthRepository } from "./modules/auth/auth.repository.js";
import {
  createAuthRouter,
  createPublicRouter,
} from "./modules/auth/auth.routes.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createCentersController } from "./modules/centers/centers.controller.js";
import { createCentersRepository } from "./modules/centers/centers.repository.js";
import { createCentersRouter } from "./modules/centers/centers.routes.js";
import { createCentersService } from "./modules/centers/centers.service.js";
import { createHealthController } from "./modules/health/health.controller.js";
import type { HealthRepository } from "./modules/health/health.repository.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createHealthService } from "./modules/health/health.service.js";
import { createUsersController } from "./modules/users/users.controller.js";
import { createUsersRepository } from "./modules/users/users.repository.js";
import {
  createParentsRouter,
  createTeachersRouter,
} from "./modules/users/users.routes.js";
import { createUsersService } from "./modules/users/users.service.js";

export type ApiDeps = {
  logger: Logger;
  config: AppConfig;
  health: { repository: HealthRepository; timeoutMs?: number | undefined };
  prisma?: PrismaClient | undefined;
  now: () => Date;
};

export type ApiMount = { path: string; router: Router };

// Every API router, in one list. The permission matrix test walks this list,
// so a route without an entry in the matrix fails the test.
export function buildApiMounts(deps: ApiDeps): ApiMount[] {
  const healthService = createHealthService({
    repository: deps.health.repository,
    logger: deps.logger,
    timeoutMs: deps.health.timeoutMs,
  });
  const mounts: ApiMount[] = [
    {
      path: "/api/health",
      router: createHealthRouter(createHealthController(healthService)),
    },
  ];
  if (deps.prisma === undefined) {
    return mounts;
  }
  const { prisma, config, now } = deps;

  const authRepository = createAuthRepository(prisma);
  const authenticate = createAuthenticate({
    secret: config.JWT_SECRET,
    now,
    lookup: async (id) => {
      const user = await authRepository.findSessionUser(id);
      return user;
    },
  });
  const authController = createAuthController(
    createAuthService({ repository: authRepository, config, now }),
    config,
  );
  const usersController = createUsersController(
    createUsersService({
      repository: createUsersRepository(prisma),
      bcryptCost: config.BCRYPT_COST,
    }),
  );

  mounts.push(
    {
      path: "/api/auth",
      router: createAuthRouter(authController, authenticate),
    },
    { path: "/api/public", router: createPublicRouter(authController) },
    {
      path: "/api/centers",
      router: createCentersRouter(
        createCentersController(
          createCentersService(createCentersRepository(prisma)),
        ),
        authenticate,
      ),
    },
    {
      path: "/api/teachers",
      router: createTeachersRouter(usersController, authenticate),
    },
    {
      path: "/api/parents",
      router: createParentsRouter(usersController, authenticate),
    },
  );
  return mounts;
}
