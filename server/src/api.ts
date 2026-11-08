import type { Router } from "express";
import type { Logger } from "pino";
import type { AppConfig } from "./config/app-config.js";
import { createAuthenticate } from "./core/middleware/authenticate.js";
import type { PrismaClient } from "./generated/prisma/client.js";
import { createAssignmentsController } from "./modules/assignments/assignments.controller.js";
import { createAssignmentsRepository } from "./modules/assignments/assignments.repository.js";
import {
  createAssignmentsRouter,
  createParentScheduleRouter,
} from "./modules/assignments/assignments.routes.js";
import { createAssignmentsService } from "./modules/assignments/assignments.service.js";
import { createPurchaseRequestsController } from "./modules/purchase-requests/purchase-requests.controller.js";
import { createPurchaseRequestsRepository } from "./modules/purchase-requests/purchase-requests.repository.js";
import {
  createPurchaseItemsRouter,
  createPurchaseRequestsRouter,
} from "./modules/purchase-requests/purchase-requests.routes.js";
import { createPurchaseRequestsService } from "./modules/purchase-requests/purchase-requests.service.js";
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
import { createDashboardController } from "./modules/dashboard/dashboard.controller.js";
import { createDashboardRepository } from "./modules/dashboard/dashboard.repository.js";
import { createDashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { createDashboardService } from "./modules/dashboard/dashboard.service.js";
import { createHealthController } from "./modules/health/health.controller.js";
import type { HealthRepository } from "./modules/health/health.repository.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createHealthService } from "./modules/health/health.service.js";
import { createChildRecordsController } from "./modules/child-records/child-records.controller.js";
import { createChildRecordsRepository } from "./modules/child-records/child-records.repository.js";
import {
  createChildRecordsRouter,
  createConferencesRouter,
  createHomeVisitsRouter,
  createProgressRouter,
} from "./modules/child-records/child-records.routes.js";
import { createChildRecordsService } from "./modules/child-records/child-records.service.js";
import { createLiquidationController } from "./modules/liquidation/liquidation.controller.js";
import { createLiquidationRepository } from "./modules/liquidation/liquidation.repository.js";
import {
  createLiquidationRouter,
  createReportsRouter,
} from "./modules/liquidation/liquidation.routes.js";
import { createLiquidationService } from "./modules/liquidation/liquidation.service.js";
import { createMenuController } from "./modules/menu/menu.controller.js";
import { createMenuRepository } from "./modules/menu/menu.repository.js";
import {
  createCalendarRouter,
  createMenuRouter,
} from "./modules/menu/menu.routes.js";
import { createMenuService } from "./modules/menu/menu.service.js";
import { createSettingsRepository } from "./modules/settings/settings.repository.js";
import { createStudentsController } from "./modules/students/students.controller.js";
import { createStudentsRepository } from "./modules/students/students.repository.js";
import {
  createEnrollmentFormRouter,
  createStudentsRouter,
} from "./modules/students/students.routes.js";
import { createStudentsService } from "./modules/students/students.service.js";
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
  const settings = createSettingsRepository(prisma);
  const authController = createAuthController(
    createAuthService({ repository: authRepository, config, settings, now }),
    config,
  );
  const usersController = createUsersController(
    createUsersService({
      repository: createUsersRepository(prisma),
      bcryptCost: config.BCRYPT_COST,
      defaultPassword: config.DEFAULT_PASSWORD,
      now,
    }),
  );

  const studentsService = createStudentsService({
    repository: createStudentsRepository(prisma),
    settings,
    now,
  });
  const studentsController = createStudentsController(studentsService);
  const childRecordsController = createChildRecordsController(
    createChildRecordsService({
      repository: createChildRecordsRepository(prisma),
      students: studentsService,
      now,
    }),
  );

  const menuController = createMenuController(
    createMenuService({ repository: createMenuRepository(prisma), now }),
  );

  const purchaseController = createPurchaseRequestsController(
    createPurchaseRequestsService({
      repository: createPurchaseRequestsRepository(prisma),
      settings,
      now,
    }),
  );
  const assignmentsController = createAssignmentsController(
    createAssignmentsService(createAssignmentsRepository(prisma)),
  );

  const liquidationController = createLiquidationController(
    createLiquidationService({
      repository: createLiquidationRepository(prisma),
      settings,
      now,
    }),
  );

  mounts.push(
    {
      path: "/api/dashboard",
      router: createDashboardRouter(
        createDashboardController(
          createDashboardService({
            repository: createDashboardRepository(prisma),
            settings,
          }),
        ),
        authenticate,
      ),
    },
    {
      path: "/api/liquidation",
      router: createLiquidationRouter(liquidationController, authenticate),
    },
    {
      path: "/api/reports",
      router: createReportsRouter(liquidationController, authenticate),
    },
    {
      path: "/api/assignments",
      router: createAssignmentsRouter(assignmentsController, authenticate),
    },
    {
      path: "/api/parent-schedule",
      router: createParentScheduleRouter(assignmentsController, authenticate),
    },
    {
      path: "/api/purchase-requests",
      router: createPurchaseRequestsRouter(purchaseController, authenticate),
    },
    {
      path: "/api/purchase-items",
      router: createPurchaseItemsRouter(purchaseController, authenticate),
    },
    {
      path: "/api/menu",
      router: createMenuRouter(menuController, authenticate),
    },
    {
      path: "/api/calendar",
      router: createCalendarRouter(menuController, authenticate),
    },
    {
      path: "/api/students",
      router: createStudentsRouter(
        studentsController,
        childRecordsController,
        authenticate,
      ),
    },
    {
      path: "/api/enrollment-form.pdf",
      router: createEnrollmentFormRouter(studentsController, authenticate),
    },
    {
      path: "/api/child-records",
      router: createChildRecordsRouter(childRecordsController, authenticate),
    },
    {
      path: "/api/conferences",
      router: createConferencesRouter(childRecordsController, authenticate),
    },
    {
      path: "/api/home-visits",
      router: createHomeVisitsRouter(childRecordsController, authenticate),
    },
    {
      path: "/api/progress",
      router: createProgressRouter(childRecordsController, authenticate),
    },
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
