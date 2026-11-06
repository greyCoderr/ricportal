import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  loginAs,
  seedMenuDays,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
type Agent = Awaited<ReturnType<typeof loginAs>>;
let teacher: Agent;
let parent: Agent;
let admin: Agent;

const DATE = "2026-11-10";
const PR = `/api/purchase-requests/${DATE}`;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => new Date("2026-11-06T02:00:00Z") });
  world = await seedWorld(prisma);
  await prisma.setting.createMany({
    data: [
      { key: "currentSchoolYear", value: "2026-2027" },
      { key: "perChildDailyRate", value: "25.00" },
    ],
  });
  await seedMenuDays(prisma, world.admin.id, [
    ["2026-11-09", "PORK PICADILLO"],
    ["2026-11-10", "CHICKEN TINOLA"],
    ["2026-11-11", "EGG CALDERETA"],
  ]);
  teacher = await loginAs(app, "teacher.a");
  parent = await loginAs(app, "parent.a");
  admin = await loginAs(app, "admin.t");
});

type Item = {
  id: number;
  itemNo: number;
  description: string;
  unit: string | null;
  quantity: string | null;
  unitCost: string | null;
  total: string | null;
  version: number;
};
type Pr = {
  status: string;
  menuName: string;
  prNo: string;
  items: Item[];
  subtotal: string;
  budget?: string;
  enrolledCount?: number;
  ratePerChild?: string;
};

function pr(res: { body: unknown }): Pr {
  return (res.body as { data: Pr }).data;
}

async function addItem(description = "Rice", date = DATE) {
  const res = await teacher
    .post(`/api/purchase-requests/${date}/items`)
    .send({ description });
  expect(res.status).toBe(201);
  return (res.body as { data: Item }).data;
}

async function assignParent(date = DATE, ids = [world.parentA.id]) {
  const res = await teacher
    .put(`/api/assignments/${date}`)
    .send({ parentIds: ids });
  expect(res.status).toBe(200);
}

function patchItem(agent: Agent, item: Item, body: object) {
  return agent
    .patch(`/api/purchase-items/${String(item.id)}`)
    .send({ version: item.version, ...body });
}

describe("open and read", () => {
  it("a day with no PR reads as not opened, with its menu and budget", async () => {
    const res = await teacher.get(PR);
    expect(res.status).toBe(200);
    expect(pr(res).status).toBe("NOT_OPENED");
    expect(pr(res).menuName).toBe("CHICKEN TINOLA");
    expect(pr(res).items).toEqual([]);
  });

  it("open is idempotent and takes the PR No. from the import", async () => {
    const first = await teacher.post(`${PR}/open`);
    expect(first.status).toBe(200);
    expect(pr(first).status).toBe("OPEN");
    expect(pr(first).prNo).toBe("SF-2026-TEST");
    const second = await teacher.post(`${PR}/open`);
    expect(second.status).toBe(200);
    expect(await prisma.purchaseRequest.count()).toBe(1);
  });

  it("a date with no menu is 404", async () => {
    expect(
      (await teacher.post("/api/purchase-requests/2026-11-20/open")).status,
    ).toBe(404);
    expect(
      (await teacher.get("/api/purchase-requests/2026-11-20")).status,
    ).toBe(404);
    expect((await teacher.get("/api/purchase-requests/nope")).status).toBe(400);
  });
});

describe("money and budget through the API", () => {
  it("computes line totals and the subtotal on the server: 266.00", async () => {
    const vectors: [string, string, string, string][] = [
      ["Rice", "2", "38.00", "76.00"],
      ["Chicken", "0.5", "340.00", "170.00"],
      ["Oil", "0.25", "80.00", "20.00"],
    ];
    for (const [name, quantity, unitCost, total] of vectors) {
      const item = await addItem(name);
      const res = await patchItem(teacher, item, {
        unit: "kg",
        quantity,
        unitCost,
      });
      expect(res.status).toBe(200);
      expect((res.body as { data: Item }).data.total).toBe(total);
    }
    const read = await teacher.get(PR);
    expect(pr(read).subtotal).toBe("266.00");
    expect(pr(read).items.map((item) => item.itemNo)).toEqual([1, 2, 3]);
  });

  it("an empty unit cost has no total and does not count", async () => {
    const item = await addItem();
    const res = await patchItem(teacher, item, { quantity: "2" });
    expect((res.body as { data: Item }).data.total).toBe(null);
    expect(pr(await teacher.get(PR)).subtotal).toBe("0.00");
  });

  it("values with commas are accepted; quantity keeps 3 decimals", async () => {
    const item = await addItem();
    const res = await patchItem(teacher, item, {
      quantity: "1,000.125",
      unitCost: "1,250.50",
    });
    expect(res.status).toBe(200);
    const row = (res.body as { data: Item }).data;
    expect(row.quantity).toBe("1000.125");
    expect(row.unitCost).toBe("1250.50");
  });

  it("rejects bad numbers and units outside UNITS", async () => {
    const item = await addItem();
    for (const body of [
      { quantity: "0" },
      { quantity: "-1" },
      { quantity: "1.2345" },
      { unitCost: "100000.01" },
      { unitCost: "1.234" },
      { unit: "sack" },
      { description: "" },
      { description: "x".repeat(81) },
    ]) {
      const res = await patchItem(teacher, item, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it("budget: 18 active children x 25.00 = 450.00, archived excluded (BR-10)", async () => {
    await seedStudents(prisma, world.centerA.id, 18);
    await seedStudents(prisma, world.centerA.id, 2, {
      status: "ARCHIVED",
      prefix: "Arch",
    });
    await seedStudents(prisma, world.centerB.id, 5, { prefix: "Other" });
    const read = pr(await teacher.get(PR));
    expect(read.budget).toBe("450.00");
    expect(read.enrolledCount).toBe(18);
    expect(read.ratePerChild).toBe("25.00");
  });

  it("zero children give a budget of 0.00", async () => {
    expect(pr(await teacher.get(PR)).budget).toBe("0.00");
  });

  it("the budget is live while OPEN and frozen on lock (BR-10)", async () => {
    await seedStudents(prisma, world.centerA.id, 10);
    await teacher.post(`${PR}/open`);
    expect(pr(await teacher.get(PR)).budget).toBe("250.00");

    await prisma.setting.update({
      where: { key: "perChildDailyRate" },
      data: { value: "30.00" },
    });
    expect(pr(await teacher.get(PR)).budget).toBe("300.00");

    await teacher.post(`${PR}/lock`);
    await prisma.setting.update({
      where: { key: "perChildDailyRate" },
      data: { value: "40.00" },
    });
    await seedStudents(prisma, world.centerA.id, 5, { prefix: "Late" });
    const locked = pr(await teacher.get(PR));
    expect(locked.budget).toBe("300.00");
    expect(locked.enrolledCount).toBe(10);
    expect(locked.ratePerChild).toBe("30.00");

    await teacher.post(`${PR}/unlock`);
    expect(pr(await teacher.get(PR)).budget).toBe("600.00");
  });
});

describe("state machine (blueprint 4.9, BR-12, BR-15)", () => {
  it.each([
    // from, action, expected status code, expected state
    ["NOT_OPENED", "lock", 409, "NOT_OPENED"],
    ["NOT_OPENED", "unlock", 409, "NOT_OPENED"],
    ["NOT_OPENED", "no-feeding", 200, "NO_FEEDING"],
    ["OPEN", "lock", 200, "LOCKED"],
    ["OPEN", "no-feeding", 200, "NO_FEEDING"],
    ["OPEN", "unlock", 200, "OPEN"],
    ["LOCKED", "lock", 200, "LOCKED"],
    ["LOCKED", "unlock", 200, "OPEN"],
    ["LOCKED", "no-feeding", 409, "LOCKED"],
    ["NO_FEEDING", "unlock", 200, "OPEN"],
    ["NO_FEEDING", "lock", 409, "NO_FEEDING"],
    ["NO_FEEDING", "no-feeding", 200, "NO_FEEDING"],
  ])("%s then %s is %i and ends %s", async (from, action, code, end) => {
    if (from === "OPEN" || from === "LOCKED") await teacher.post(`${PR}/open`);
    if (from === "LOCKED") await teacher.post(`${PR}/lock`);
    if (from === "NO_FEEDING") await teacher.post(`${PR}/no-feeding`);

    const res = await teacher.post(`${PR}/${action}`);
    expect(res.status).toBe(code);
    expect(pr(await teacher.get(PR)).status).toBe(end);
  });

  it("a locked day cannot be edited by anyone; unlock reopens it", async () => {
    await assignParent();
    const item = await addItem();
    await teacher.post(`${PR}/lock`);

    for (const agent of [teacher, parent]) {
      const res = await patchItem(agent, item, { quantity: "2" });
      expect(res.status).toBe(409);
    }
    expect(
      (await teacher.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(409);
    expect(
      (await teacher.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(409);

    await teacher.post(`${PR}/unlock`);
    expect((await patchItem(parent, item, { quantity: "2" })).status).toBe(200);
  });

  it("deleting a row renumbers the rest 1 to n (BR-11)", async () => {
    await addItem("Rice");
    const second = await addItem("Oil");
    await addItem("Salt");
    expect(
      (await teacher.delete(`/api/purchase-items/${String(second.id)}`)).status,
    ).toBe(200);
    const read = pr(await teacher.get(PR));
    expect(read.items.map((item) => [item.itemNo, item.description])).toEqual([
      [1, "Rice"],
      [2, "Salt"],
    ]);
  });
});

describe("field rights by role (BR-12, A-14)", () => {
  it("an assigned Parent edits unit, quantity and cost only", async () => {
    await assignParent();
    const item = await addItem();
    const res = await patchItem(parent, item, {
      unit: "kg",
      quantity: "2",
      unitCost: "38.00",
    });
    expect(res.status).toBe(200);
    expect((res.body as { data: Item }).data.total).toBe("76.00");
    const row = await prisma.purchaseItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(row.filledBy).toBe(world.parentA.id);

    const renamed = await patchItem(
      parent,
      { ...item, version: item.version + 1 },
      {
        description: "Sugar",
      },
    );
    expect(renamed.status).toBe(403);
    const after = await prisma.purchaseItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(after.description).toBe("Rice");
  });

  it("a Parent cannot add or delete rows, open, lock or unlock", async () => {
    await assignParent();
    const item = await addItem();
    expect(
      (await parent.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(403);
    expect(
      (await parent.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(403);
    for (const action of ["open", "lock", "unlock", "no-feeding"]) {
      expect((await parent.post(`${PR}/${action}`)).status, action).toBe(403);
    }
  });

  it("the Teacher can rename a row", async () => {
    const item = await addItem();
    const res = await patchItem(teacher, item, { description: "Brown rice" });
    expect((res.body as { data: Item }).data.description).toBe("Brown rice");
  });

  it("the Admin reads but cannot change anything", async () => {
    const item = await addItem();
    const read = await admin.get(`${PR}?centerId=${String(world.centerA.id)}`);
    expect(read.status).toBe(200);
    expect(pr(read).items.length).toBe(1);
    expect(pr(read).budget).toBeDefined();

    expect((await admin.get(PR)).status).toBe(400);
    expect((await patchItem(admin, item, { quantity: "2" })).status).toBe(403);
    expect((await admin.post(`${PR}/lock`)).status).toBe(403);
    expect(
      (await admin.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(403);
  });
});

describe("version conflict", () => {
  it("a stale version is 409 with the plain message, and nothing changes", async () => {
    await assignParent();
    const item = await addItem();
    const first = await patchItem(teacher, item, { quantity: "2" });
    expect(first.status).toBe(200);
    expect((first.body as { data: Item }).data.version).toBe(item.version + 1);

    const stale = await patchItem(parent, item, { quantity: "9" });
    expect(stale.status).toBe(409);
    expect(
      (stale.body as { error: { code: string; message: string } }).error,
    ).toMatchObject({
      code: "CONFLICT",
      message: "Updated by someone else. Your change was not saved.",
    });
    const row = await prisma.purchaseItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(row.quantity?.toString()).toBe("2");
  });

  it("version is required", async () => {
    const item = await addItem();
    const res = await teacher
      .patch(`/api/purchase-items/${String(item.id)}`)
      .send({ quantity: "2" });
    expect(res.status).toBe(400);
  });
});

describe("what a Parent may see (BR-14, DEC-026)", () => {
  it("the Parent response never has budget fields; the Teacher response does", async () => {
    await seedStudents(prisma, world.centerA.id, 18);
    await assignParent();
    await addItem();

    const forParent = await parent.get(PR);
    expect(forParent.status).toBe(200);
    const text = JSON.stringify(forParent.body);
    for (const field of ["budget", "enrolledCount", "ratePerChild"]) {
      expect(text).not.toContain(field);
    }
    expect(pr(forParent).subtotal).toBe("0.00");

    const forTeacher = pr(await teacher.get(PR));
    expect(forTeacher.budget).toBe("450.00");
    expect(forTeacher.enrolledCount).toBe(18);
    expect(forTeacher.ratePerChild).toBe("25.00");
  });

  it("a PATCH answer to a Parent has no budget fields either", async () => {
    await assignParent();
    const item = await addItem();
    const res = await patchItem(parent, item, { quantity: "1" });
    const text = JSON.stringify(res.body);
    for (const field of ["budget", "enrolledCount", "ratePerChild"]) {
      expect(text).not.toContain(field);
    }
  });

  it("an unassigned Parent gets 404, for reading and editing", async () => {
    const item = await addItem();
    expect((await parent.get(PR)).status).toBe(404);
    expect((await patchItem(parent, item, { quantity: "2" })).status).toBe(404);
  });

  it("a Parent removed from the day loses access at once", async () => {
    await assignParent();
    const item = await addItem();
    await assignParent(DATE, []);
    expect((await parent.get(PR)).status).toBe(404);
    expect((await patchItem(parent, item, { quantity: "2" })).status).toBe(404);
  });

  it("an assigned day with no PR yet reads as not opened", async () => {
    await assignParent();
    const res = await parent.get(PR);
    expect(res.status).toBe(200);
    expect(pr(res).status).toBe("NOT_OPENED");
  });

  it("the schedule lists only assigned days, with the status", async () => {
    await assignParent("2026-11-09");
    await assignParent("2026-11-11");
    await teacher.post("/api/purchase-requests/2026-11-11/lock").expect(409);
    await teacher.post("/api/purchase-requests/2026-11-11/open");
    await teacher.post("/api/purchase-requests/2026-11-11/lock");

    const res = await parent.get(
      "/api/parent-schedule?from=2026-11-01&to=2026-11-30",
    );
    expect(res.status).toBe(200);
    const rows = (
      res.body as { data: { date: string; menuName: string; status: string }[] }
    ).data;
    expect(rows.map((row) => [row.date, row.menuName, row.status])).toEqual([
      ["2026-11-09", "PORK PICADILLO", "NOT_OPENED"],
      ["2026-11-11", "EGG CALDERETA", "LOCKED"],
    ]);
    expect(JSON.stringify(res.body)).not.toContain("budget");
    expect(
      (await parent.get("/api/parent-schedule?from=nope&to=2026-11-30")).status,
    ).toBe(400);
  });
});

describe("scope (BR-02)", () => {
  it("each center has its own PR for the same day; another center's item is 404", async () => {
    const item = await addItem("Rice");
    const other = await loginAs(app, "teacher.b");
    const read = await other.get(PR);
    expect(read.status).toBe(200);
    expect(pr(read).items).toEqual([]);
    expect((await patchItem(other, item, { quantity: "2" })).status).toBe(404);
    expect(
      (await other.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(404);

    await addItemFor(other, "Oil");
    expect(await prisma.purchaseRequest.count()).toBe(2);
    expect(
      pr(await teacher.get(PR)).items.map((row) => row.description),
    ).toEqual(["Rice"]);
  });

  async function addItemFor(agent: Agent, description: string) {
    const res = await agent.post(`${PR}/items`).send({ description });
    expect(res.status).toBe(201);
  }

  it("a Teacher cannot read another center by asking for it", async () => {
    const res = await teacher.get(`${PR}?centerId=${String(world.centerB.id)}`);
    expect(res.status).toBe(404);
  });

  it("a Parent of another center assigned nowhere sees nothing", async () => {
    await assignParent();
    const other = await loginAs(app, "parent.b");
    expect((await other.get(PR)).status).toBe(404);
  });
});

describe("assignments (BR-13)", () => {
  type Day = {
    date: string;
    menuName: string | null;
    status: string;
    parents: { id: number; fullName: string }[];
  };
  const WEEK = "/api/assignments?week=2026-11-09";

  it("returns seven days Monday to Sunday, with menus, Parents and status", async () => {
    await assignParent();
    await teacher.post("/api/purchase-requests/2026-11-11/open");
    const res = await teacher.get(WEEK);
    expect(res.status).toBe(200);
    const days = (res.body as { data: Day[] }).data;
    expect(days.map((day) => day.date)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(days[0]?.menuName).toBe("PORK PICADILLO");
    expect(days[1]?.parents.map((parentRow) => parentRow.id)).toEqual([
      world.parentA.id,
    ]);
    expect(days[2]?.status).toBe("OPEN");
    expect(days[3]?.menuName).toBe(null);
    expect(days[0]?.status).toBe("NOT_OPENED");
  });

  it("the week must be a Monday", async () => {
    expect((await teacher.get("/api/assignments?week=2026-11-10")).status).toBe(
      400,
    );
    expect((await teacher.get("/api/assignments")).status).toBe(400);
  });

  it("PUT replaces the set for the day", async () => {
    const second = await prisma.user.create({
      data: {
        username: "parent.second",
        role: "PARENT",
        centerId: world.centerA.id,
        fullName: "Second Parent",
        passwordHash: "x",
      },
    });
    await assignParent(DATE, [world.parentA.id, second.id]);
    expect(await prisma.feedingAssignment.count()).toBe(2);
    await assignParent(DATE, [second.id]);
    const rows = await prisma.feedingAssignment.findMany();
    expect(rows.map((row) => row.parentId)).toEqual([second.id]);
    expect(rows[0]?.assignedBy).toBe(world.teacherA.id);
  });

  it("rejects a Parent of another center, a pending Parent and a non-feeding day", async () => {
    const otherCenter = await teacher
      .put(`/api/assignments/${DATE}`)
      .send({ parentIds: [world.parentB.id] });
    expect(otherCenter.status).toBe(422);

    const pending = await prisma.user.create({
      data: {
        username: "parent.pending",
        role: "PARENT",
        status: "PENDING",
        centerId: world.centerA.id,
        fullName: "Pending Parent",
        passwordHash: "x",
      },
    });
    const notApproved = await teacher
      .put(`/api/assignments/${DATE}`)
      .send({ parentIds: [pending.id] });
    expect(notApproved.status).toBe(422);

    const noMenu = await teacher
      .put("/api/assignments/2026-11-20")
      .send({ parentIds: [world.parentA.id] });
    expect(noMenu.status).toBe(422);

    expect(await prisma.feedingAssignment.count()).toBe(0);
  });

  it("approved Parents: own center and active only", async () => {
    await prisma.user.create({
      data: {
        username: "parent.pending",
        role: "PARENT",
        status: "PENDING",
        centerId: world.centerA.id,
        fullName: "Pending Parent",
        passwordHash: "x",
      },
    });
    const res = await teacher.get("/api/parents/approved");
    expect(res.status).toBe(200);
    const rows = (res.body as { data: { id: number; fullName: string }[] })
      .data;
    expect(rows.map((row) => row.id)).toEqual([world.parentA.id]);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });
});
