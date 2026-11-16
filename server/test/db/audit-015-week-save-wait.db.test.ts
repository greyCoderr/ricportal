import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { TRANSACTION_OPTIONS } from "../../src/core/db.js";
import { createAssignmentsRepository } from "../../src/modules/assignments/assignments.repository.js";
import {
  buildApp,
  createUser,
  loginAs,
  seedMenuDays,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-015 (docs/AUDIT_REPORT.md) and the intermittent 404 of "a Parent adds a
// row": a week save that has to wait more than Prisma's default 5 seconds used
// to fail with a 500, and the Parent's next request then answered 404 because
// the assignment was never saved. The save now has explicit, longer limits.

const WEEK = "2026-11-09";
const TUE = "2026-11-10";
const HOLD_MS = 6500;

let prisma: PrismaClient;
let blocker: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

beforeAll(() => {
  prisma = createTestPrisma();
  blocker = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
  await blocker.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  world = await seedWorld(prisma);
  await seedMenuDays(prisma, world.admin.id, [[TUE, "CHICKEN TINOLA"]]);
});

describe("a week save that has to wait (AUD-015)", () => {
  it("the configured limits are passed to the week save's transaction", async () => {
    const seen: unknown[] = [];
    const fake = {
      $transaction: (_work: unknown, options: unknown) => {
        seen.push(options);
        return Promise.resolve();
      },
    } as unknown as PrismaClient;
    const repository = createAssignmentsRepository(fake);
    await repository.saveWeek({
      centerId: 1,
      monday: WEEK,
      sunday: "2026-11-15",
      teamParentIds: [],
      days: [],
      assignedBy: 1,
    });
    await repository.replaceAssignments({
      centerId: 1,
      date: TUE,
      monday: WEEK,
      parentIds: [],
      assignedBy: 1,
    });
    expect(seen).toEqual([TRANSACTION_OPTIONS, TRANSACTION_OPTIONS]);
    expect(TRANSACTION_OPTIONS.timeout).toBeGreaterThanOrEqual(20_000);
    expect(TRANSACTION_OPTIONS.maxWait).toBeGreaterThanOrEqual(10_000);
  });

  it("waits 6.5 seconds for a row lock, then saves; the Parent can then add a row", async () => {
    // An earlier assignment of another Parent on that day, which the save has
    // to delete. Parent A has none yet, as in the test that failed.
    const earlier = await createUser(prisma, {
      username: "parent.earlier",
      role: "PARENT",
      centerId: world.centerA.id,
    });
    const old = await prisma.feedingAssignment.create({
      data: {
        centerId: world.centerA.id,
        feedingDate: new Date(`${TUE}T00:00:00.000Z`),
        parentId: earlier.id,
        assignedBy: world.teacherA.id,
      },
    });
    const teacher = await loginAs(app, "teacher.a");
    const parent = await loginAs(app, "parent.a");

    // Another connection holds that row, as a slow or busy database would.
    let locked: () => void = () => undefined;
    const hasLock = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const holding = blocker.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM feeding_assignments WHERE id = ${old.id} FOR UPDATE`;
        locked();
        await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
    await hasLock;

    const saved = await teacher.put("/api/assignments/week").send({
      week: WEEK,
      teamParentIds: [world.parentA.id],
      days: [{ date: TUE, parentIds: [world.parentA.id] }],
    });
    await holding;
    const added = await parent
      .post(`/api/purchase-requests/${TUE}/items`)
      .send({ description: "Rice" });

    expect({ save: saved.status, add: added.status }).toEqual({
      save: 200,
      add: 201,
    });
  }, 60_000);
});
