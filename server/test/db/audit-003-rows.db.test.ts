import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createPurchaseRequestsRepository } from "../../src/modules/purchase-requests/purchase-requests.repository.js";
import { buildApp, loginAs, seedMenuDays, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-003 (docs/AUDIT_REPORT.md): rows added at the same moment keep the
// numbers 1 to n (BR-11), a day not opened yet opens once, and a row cannot be
// added or deleted once the day is no longer OPEN (BR-12).

const DAY = "2026-11-10";
const ITEMS = `/api/purchase-requests/${DAY}/items`;

type Agent = Awaited<ReturnType<typeof loginAs>>;

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
let teacher: Agent;
let parent: Agent;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  world = await seedWorld(prisma);
  await seedMenuDays(prisma, world.admin.id, [[DAY, "CHICKEN TINOLA"]]);
  await prisma.feedingAssignment.create({
    data: {
      centerId: world.centerA.id,
      feedingDate: new Date(`${DAY}T00:00:00.000Z`),
      parentId: world.parentA.id,
      assignedBy: world.teacherA.id,
    },
  });
  teacher = await loginAs(app, "teacher.a");
  parent = await loginAs(app, "parent.a");
});

async function itemNumbers() {
  const rows = await prisma.purchaseItem.findMany({
    orderBy: { itemNo: "asc" },
    select: { itemNo: true },
  });
  return rows.map((row) => row.itemNo);
}

describe("rows added at the same moment (BR-11, AUD-003)", () => {
  it("a Teacher and a Parent adding at once on a day not opened yet: one day, numbers 1 to 4", async () => {
    const answers = await Promise.all([
      teacher.post(ITEMS).send({ description: "Rice" }),
      parent.post(ITEMS).send({ description: "Oil" }),
      teacher.post(ITEMS).send({ description: "Salt" }),
      parent.post(ITEMS).send({ description: "Egg" }),
    ]);

    expect(answers.map((res) => res.status)).toEqual([201, 201, 201, 201]);
    expect(await prisma.purchaseRequest.count()).toBe(1);
    expect(await itemNumbers()).toEqual([1, 2, 3, 4]);
  });

  it("six rows at once on an open day keep the numbers 1 to 7", async () => {
    expect(
      (await teacher.post(ITEMS).send({ description: "Rice" })).status,
    ).toBe(201);
    const answers = await Promise.all(
      ["Oil", "Salt", "Egg", "Onion", "Garlic", "Ginger"].map(
        (description, index) =>
          (index % 2 === 0 ? teacher : parent)
            .post(ITEMS)
            .send({ description }),
      ),
    );
    expect(answers.map((res) => res.status)).toEqual(
      Array.from({ length: 6 }, () => 201),
    );
    expect(await itemNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("the write itself refuses a day that is not OPEN (BR-12, AUD-003)", () => {
  // The service checks the status first. These call the repository directly, as a
  // request does that passed that check a moment before the Teacher locked the day.
  async function lockedDayWithOneRow() {
    const added = await teacher.post(ITEMS).send({ description: "Rice" });
    expect(added.status).toBe(201);
    const locked = await teacher.post(`/api/purchase-requests/${DAY}/lock`);
    expect(locked.status).toBe(200);
    const pr = await prisma.purchaseRequest.findFirstOrThrow();
    const item = await prisma.purchaseItem.findFirstOrThrow();
    return { pr, item };
  }

  it("adding a row to a locked day writes nothing", async () => {
    const { pr } = await lockedDayWithOneRow();
    const repository = createPurchaseRequestsRepository(prisma);
    const result = await repository.addItem(pr.id, "Oil", world.parentA.id);
    expect(result).toBe(null);
    expect(await itemNumbers()).toEqual([1]);
  });

  it("deleting a row of a locked day deletes nothing", async () => {
    const { pr, item } = await lockedDayWithOneRow();
    const repository = createPurchaseRequestsRepository(prisma);
    const result = await repository.deleteItem(item.id, pr.id);
    expect(result).toBe(false);
    expect(await itemNumbers()).toEqual([1]);
  });

  it("through the API a locked day still answers 409 for add and delete", async () => {
    const { item } = await lockedDayWithOneRow();
    const add = await parent.post(ITEMS).send({ description: "Oil" });
    expect(add.status).toBe(409);
    const remove = await teacher.delete(
      `/api/purchase-items/${String(item.id)}`,
    );
    expect(remove.status).toBe(409);
    expect(await itemNumbers()).toEqual([1]);
  });
});
