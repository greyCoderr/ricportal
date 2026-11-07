import type { Express, Router } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApiMounts } from "../../src/api.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { upRepository } from "../stub-health.js";
import { testConfig } from "../test-config.js";
import { createLogger } from "../../src/core/logger.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

type Role = "ADMIN" | "TEACHER" | "PARENT";
type Access = "PUBLIC" | "ANY" | Role[];
type Row = [
  method: "get" | "post" | "patch" | "put" | "delete",
  path: string,
  access: Access,
];

const A: Role[] = ["ADMIN"];
const T: Role[] = ["TEACHER"];
const AT: Role[] = ["ADMIN", "TEACHER"];
const P: Role[] = ["PARENT"];
const TP: Role[] = ["TEACHER", "PARENT"];
const ATP: Role[] = ["ADMIN", "TEACHER", "PARENT"];

// Every API route and who may call it (P1-T12). Ids that do not exist are used,
// so an allowed role gets 400 or 404 and nothing changes. A route missing from
// this table fails the "every route is listed" test.
export const MATRIX: Row[] = [
  ["get", "/api/health", "PUBLIC"],
  ["post", "/api/auth/login", "PUBLIC"],
  ["post", "/api/auth/parent-signup", "PUBLIC"],
  ["get", "/api/public/centers", "PUBLIC"],
  ["post", "/api/auth/logout", "ANY"],
  ["get", "/api/auth/me", "ANY"],
  ["post", "/api/auth/change-password", "ANY"],
  ["get", "/api/auth/profile", ATP],
  ["patch", "/api/auth/profile", ATP],
  ["get", "/api/centers", A],
  ["post", "/api/centers", A],
  ["patch", "/api/centers/:id", A],
  ["get", "/api/dashboard/summary", A],
  ["get", "/api/reports/feedback", T],
  ["get", "/api/teachers", A],
  ["post", "/api/teachers", A],
  ["patch", "/api/teachers/:id", A],
  ["post", "/api/teachers/:id/reset-password", A],
  ["get", "/api/parents", T],
  ["post", "/api/parents/:id/approve", T],
  ["post", "/api/parents/:id/decline", T],
  ["post", "/api/parents/:id/disable", T],
  ["post", "/api/parents/:id/enable", T],
  ["post", "/api/parents/:id/reset-password", T],
  ["get", "/api/students", AT],
  ["get", "/api/students/summary", AT],
  ["post", "/api/students", T],
  ["get", "/api/students/:id", AT],
  ["patch", "/api/students/:id", T],
  ["post", "/api/students/:id/archive", T],
  ["post", "/api/students/:id/restore", T],
  ["get", "/api/students/:id/conferences", AT],
  ["post", "/api/students/:id/conferences", T],
  ["get", "/api/students/:id/home-visits", AT],
  ["post", "/api/students/:id/home-visits", T],
  ["get", "/api/students/:id/progress", AT],
  ["post", "/api/students/:id/progress", T],
  ["patch", "/api/conferences/:id", T],
  ["delete", "/api/conferences/:id", T],
  ["patch", "/api/home-visits/:id", T],
  ["delete", "/api/home-visits/:id", T],
  ["patch", "/api/progress/:id", T],
  ["delete", "/api/progress/:id", T],
  ["get", "/api/enrollment-form.pdf", AT],
  ["post", "/api/menu/imports/preview", A],
  ["post", "/api/menu/imports/confirm", A],
  ["get", "/api/menu/batches", A],
  ["get", "/api/calendar", AT],
  ["get", "/api/parents/approved", T],
  ["get", "/api/assignments", T],
  ["get", "/api/assignments/week", T],
  ["put", "/api/assignments/week", T],
  ["put", "/api/assignments/:date", T],
  ["get", "/api/parent-schedule", P],
  ["get", "/api/purchase-requests/:date", ATP],
  ["post", "/api/purchase-requests/:date/open", T],
  ["post", "/api/purchase-requests/:date/items", TP],
  ["post", "/api/purchase-requests/:date/lock", T],
  ["post", "/api/purchase-requests/:date/unlock", T],
  ["post", "/api/purchase-requests/:date/no-feeding", T],
  ["patch", "/api/purchase-items/:id", TP],
  ["delete", "/api/purchase-items/:id", TP],
  ["get", "/api/liquidation/preview", T],
  ["post", "/api/liquidation/submit", T],
  ["get", "/api/liquidation/pdf/purchase-request", AT],
  ["get", "/api/liquidation/pdf/summary", AT],
  ["get", "/api/liquidation/pdf/transmittal", AT],
  ["get", "/api/reports", AT],
  ["get", "/api/reports/:id", AT],
  ["get", "/api/reports/:id/snapshot", AT],
  ["post", "/api/reports/:id/review", A],
  ["get", "/api/reports/:id/pdf/purchase-request", AT],
  ["get", "/api/reports/:id/pdf/summary", AT],
  ["get", "/api/reports/:id/pdf/transmittal", AT],
];

function routesOf(router: Router): { method: string; path: string }[] {
  const found: { method: string; path: string }[] = [];
  const stack = (
    router as unknown as {
      stack: { route?: { path: string; methods: Record<string, boolean> } }[];
    }
  ).stack;
  for (const layer of stack) {
    if (layer.route !== undefined) {
      for (const method of Object.keys(layer.route.methods)) {
        found.push({ method, path: layer.route.path });
      }
    }
  }
  return found;
}

const FILLED = (path: string) =>
  path.replaceAll(":id", "999999").replaceAll(":date", "2026-11-10");

let prisma: PrismaClient;
let app: Express;
const agents = {} as Record<Role, ReturnType<typeof request.agent>>;

beforeAll(async () => {
  prisma = createTestPrisma();
  await resetDatabase(prisma);
  await seedWorld(prisma);
  app = buildApp(prisma);
  agents.ADMIN = await loginAs(app, "admin.t");
  agents.TEACHER = await loginAs(app, "teacher.a");
  agents.PARENT = await loginAs(app, "parent.a");
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("permission matrix", () => {
  it("every route is listed, and every listed route exists", () => {
    const mounts = buildApiMounts({
      prisma,
      config: testConfig(),
      logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      now: () => new Date(),
      health: { repository: upRepository() },
    });
    const actual = mounts.flatMap((mount) =>
      routesOf(mount.router).map((route) => {
        const suffix = route.path === "/" ? "" : route.path;
        return `${route.method} ${mount.path}${suffix}`;
      }),
    );
    const listed = MATRIX.map(([method, path]) => `${method} ${path}`);
    expect([...actual].sort()).toEqual([...listed].sort());
  });

  const rows = MATRIX.filter(([, path]) => path !== "/api/auth/logout");
  describe.each(rows)("%s %s", (method, path, access) => {
    const url = FILLED(path);

    it("anonymous", async () => {
      const res = await request(app)[method](url).send({});
      if (access === "PUBLIC") {
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      } else {
        expect(res.status).toBe(401);
      }
    });

    it.each(["ADMIN", "TEACHER", "PARENT"] as const)("%s", async (role) => {
      const res = await agents[role][method](url).send({});
      const allowed =
        access === "PUBLIC" || access === "ANY" || access.includes(role);
      if (allowed) {
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
      } else {
        expect(res.status).toBe(403);
      }
    });
  });

  it("logout needs a session", async () => {
    expect((await request(app).post("/api/auth/logout")).status).toBe(401);
  });
});
