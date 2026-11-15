import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createLiquidationRepository } from "../../src/modules/liquidation/liquidation.repository.js";
import { createPurchaseRequestsRepository } from "../../src/modules/purchase-requests/purchase-requests.repository.js";
import {
  buildApp,
  loginAs,
  seedMenuDays,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-004 (docs/AUDIT_REPORT.md): lock, unlock, No feeding and Submit change a
// day only from the state they expect, in the same statement that writes. So
// an unlock sent at the same moment as a submit cannot leave an editable day
// inside a submitted report (BR-12, BR-16).

const DAY1 = "2026-11-09";
const DAY2 = "2026-11-10";
const RANGE = { from: DAY1, to: DAY2 };
const SNAPSHOT = {
  enrolledCount: 18,
  ratePerChild: "25.00",
  budget: "450.00",
  lockedAt: new Date("2026-11-12T02:00:00Z"),
  lockedBy: 1,
};

type Agent = Awaited<ReturnType<typeof loginAs>>;

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
let teacher: Agent;

async function setUp() {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => new Date("2026-11-12T02:00:00Z") });
  world = await seedWorld(prisma);
  await prisma.setting.createMany({
    data: [
      { key: "currentSchoolYear", value: "2026-2027" },
      { key: "perChildDailyRate", value: "25.00" },
    ],
  });
  await seedMenuDays(prisma, world.admin.id, [
    [DAY1, "PORK PICADILLO"],
    [DAY2, "CHICKEN TINOLA"],
  ]);
  await seedStudents(prisma, world.centerA.id, 18);
  teacher = await loginAs(app, "teacher.a");
}

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(setUp);

async function dayWithRow(date: string, lock: boolean) {
  const added = await teacher
    .post(`/api/purchase-requests/${date}/items`)
    .send({ description: "Rice" });
  expect(added.status).toBe(201);
  if (lock) {
    expect(
      (await teacher.post(`/api/purchase-requests/${date}/lock`)).status,
    ).toBe(200);
  }
}

function findDay(date: string) {
  return prisma.purchaseRequest.findFirstOrThrow({
    where: { feedingDate: new Date(`${date}T00:00:00.000Z`) },
  });
}

describe("each change checks the state in the write itself (AUD-004)", () => {
  it("a day that is part of a submitted report cannot be reopened by the repository", async () => {
    await dayWithRow(DAY1, true);
    await dayWithRow(DAY2, true);
    expect(
      (await teacher.post("/api/liquidation/submit").send(RANGE)).status,
    ).toBe(201);
    const day = await findDay(DAY1);

    const result = await createPurchaseRequestsRepository(prisma).setOpen(
      day.id,
    );

    expect(result).toBe(null);
    expect((await findDay(DAY1)).status).toBe("LOCKED");
  });

  it("a No feeding day is not locked by a late lock", async () => {
    expect(
      (await teacher.post(`/api/purchase-requests/${DAY1}/no-feeding`)).status,
    ).toBe(200);
    const day = await findDay(DAY1);

    const result = await createPurchaseRequestsRepository(prisma).lock(
      day.id,
      SNAPSHOT,
    );

    expect(result).toBe(null);
    expect((await findDay(DAY1)).status).toBe("NO_FEEDING");
  });

  it("a locked day is not marked No feeding by a late request", async () => {
    await dayWithRow(DAY1, true);
    const day = await findDay(DAY1);

    const result = await createPurchaseRequestsRepository(prisma).setNoFeeding(
      day.id,
    );

    expect(result).toBe(null);
    expect((await findDay(DAY1)).status).toBe("LOCKED");
  });

  it("submit refuses a day that was reopened after the totals were read", async () => {
    await dayWithRow(DAY1, true);
    await dayWithRow(DAY2, false);
    const days = await prisma.purchaseRequest.findMany();

    await expect(
      createLiquidationRepository(prisma).submit({
        centerId: world.centerA.id,
        teacherId: world.teacherA.id,
        from: DAY1,
        to: DAY2,
        prIds: days.map((day) => day.id),
        payload: { total: "0.00" },
        at: new Date(),
      }),
    ).rejects.toThrow();

    expect(await prisma.report.count()).toBe(0);
    expect(await prisma.liquidationSnapshot.count()).toBe(0);
  });
});

describe("unlock and submit sent at the same moment (AUD-004)", () => {
  it("one of them wins; a submitted report never holds an open day", async () => {
    const outcomes: string[] = [];
    for (let round = 0; round < 6; round += 1) {
      if (round > 0) {
        await setUp();
      }
      await dayWithRow(DAY1, true);
      await dayWithRow(DAY2, true);

      const [unlock, submit] = await Promise.all([
        teacher.post(`/api/purchase-requests/${DAY1}/unlock`),
        teacher.post("/api/liquidation/submit").send(RANGE),
      ]);

      const day = await findDay(DAY1);
      const reports = await prisma.report.count();
      const seen = {
        unlock: unlock.status,
        submit: submit.status,
        reports,
        day: day.status,
        marked: day.submittedReportId !== null,
      };
      if (reports === 1) {
        expect(seen).toEqual({
          unlock: 409,
          submit: 201,
          reports: 1,
          day: "LOCKED",
          marked: true,
        });
        outcomes.push("submit");
      } else {
        expect([409, 422]).toContain(submit.status);
        expect(seen).toEqual({
          unlock: 200,
          submit: submit.status,
          reports: 0,
          day: "OPEN",
          marked: false,
        });
        outcomes.push("unlock");
      }
    }
    expect(outcomes).toHaveLength(6);
  }, 180_000);
});
