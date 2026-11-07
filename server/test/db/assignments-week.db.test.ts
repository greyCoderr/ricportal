import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createAssignmentsRepository } from "../../src/modules/assignments/assignments.repository.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createUser,
  loginAs,
  seedMenuDays,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
type Agent = Awaited<ReturnType<typeof loginAs>>;
let teacher: Agent;
let team: number[];

const WEEK = "2026-11-09";
const TUE = "2026-11-10";
const WED = "2026-11-11";
const URL = "/api/assignments/week";

type WeekBody = {
  data: {
    week: string;
    team: { id: number; fullName: string; username: string }[];
    days: {
      date: string;
      menuName: string | null;
      parents: { id: number; fullName: string }[];
    }[];
  };
};

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
  await seedMenuDays(prisma, world.admin.id, [
    ["2026-11-09", "PORK PICADILLO"],
    [TUE, "CHICKEN TINOLA"],
    [WED, "EGG CALDERETA"],
    // The next Monday belongs to the next week.
    ["2026-11-16", "SINIGANG NA BABOY"],
  ]);
  team = [world.parentA.id];
  for (const name of ["parent.c1", "parent.c2", "parent.c3", "parent.c4"]) {
    const user = await createUser(prisma, {
      username: name,
      role: "PARENT",
      centerId: world.centerA.id,
    });
    team.push(user.id);
  }
  teacher = await loginAs(app, "teacher.a");
});

function save(body: object, agent: Agent = teacher) {
  return agent.put(URL).send({ week: WEEK, ...body });
}

function expectRule(res: { status: number }) {
  expect(res.status).toBe(422);
}

async function assignmentRows() {
  return prisma.feedingAssignment.count();
}

describe("PUT /api/assignments/week (D4)", () => {
  it("saves the team and the days, and GET reads them back", async () => {
    const res = await save({
      teamParentIds: team.slice(0, 4),
      days: [
        { date: TUE, parentIds: [team[0], team[1]] },
        { date: WED, parentIds: team.slice(0, 4) },
      ],
    });
    expect(res.status).toBe(200);

    const read = await teacher.get(`${URL}?week=${WEEK}`);
    expect(read.status).toBe(200);
    const { data } = read.body as WeekBody;
    expect(data.week).toBe(WEEK);
    expect(data.team.map((row) => row.id).sort()).toEqual(
      team.slice(0, 4).sort(),
    );
    expect(data.team[0]?.username).toBeDefined();
    expect(data.days.map((day) => day.date)).toEqual([
      "2026-11-09",
      TUE,
      WED,
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(data.days[1]?.parents.length).toBe(2);
    expect(data.days[2]?.parents.length).toBe(4);
    expect(data.days[0]?.parents).toEqual([]);
    expect(data.days[3]?.menuName).toBe(null);
  });

  it("a second save replaces the whole week", async () => {
    await save({
      teamParentIds: [team[0], team[1]],
      days: [
        { date: TUE, parentIds: [team[0]] },
        { date: WED, parentIds: [team[1]] },
      ],
    });
    const res = await save({
      teamParentIds: [team[2]],
      days: [{ date: TUE, parentIds: [team[2]] }],
    });
    expect(res.status).toBe(200);
    const rows = await prisma.feedingAssignment.findMany();
    expect(rows.map((row) => row.parentId)).toEqual([team[2]]);
    expect(rows[0]?.assignedBy).toBe(world.teacherA.id);
    const { data } = (await teacher.get(`${URL}?week=${WEEK}`))
      .body as WeekBody;
    expect(data.team.map((row) => row.id)).toEqual([team[2]]);
  });

  it("keeps other weeks and other centers untouched", async () => {
    const other = await loginAs(app, "teacher.b");
    await save(
      {
        teamParentIds: [world.parentB.id],
        days: [{ date: TUE, parentIds: [world.parentB.id] }],
      },
      other,
    );
    await teacher
      .put("/api/assignments/2026-11-16")
      .send({ parentIds: [team[0]] });
    await save({ teamParentIds: [], days: [] });
    expect(await assignmentRows()).toBe(2);
  });

  it("rejects a 5th team member", async () => {
    expectRule(await save({ teamParentIds: team, days: [] }));
    expect(await prisma.feedingAssignment.count()).toBe(0);
  });

  it("rejects the same parent twice in the team", async () => {
    expectRule(await save({ teamParentIds: [team[0], team[0]], days: [] }));
  });

  it("team parents must be approved and of the same center", async () => {
    expectRule(await save({ teamParentIds: [world.parentB.id], days: [] }));
    const pending = await createUser(prisma, {
      username: "parent.pending",
      role: "PARENT",
      status: "PENDING",
      centerId: world.centerA.id,
    });
    expectRule(await save({ teamParentIds: [pending.id], days: [] }));
    const disabled = await createUser(prisma, {
      username: "parent.off",
      role: "PARENT",
      status: "DISABLED",
      centerId: world.centerA.id,
    });
    expectRule(await save({ teamParentIds: [disabled.id], days: [] }));
    expectRule(await save({ teamParentIds: [world.teacherA.id], days: [] }));
  });

  it("day parents must belong to the team", async () => {
    expectRule(
      await save({
        teamParentIds: [team[0]],
        days: [{ date: TUE, parentIds: [team[1]] }],
      }),
    );
    expect(await assignmentRows()).toBe(0);
  });

  it("the week runs Monday to Sunday", async () => {
    const tuesday = await teacher
      .put(URL)
      .send({ week: TUE, teamParentIds: [], days: [] });
    expect(tuesday.status).toBe(400);
    expect((await teacher.get(`${URL}?week=${TUE}`)).status).toBe(400);

    // The Monday after the Sunday is outside, even though it has a menu.
    expectRule(
      await save({
        teamParentIds: [team[0]],
        days: [{ date: "2026-11-16", parentIds: [team[0]] }],
      }),
    );
    // So is the Sunday before.
    expectRule(
      await save({
        teamParentIds: [team[0]],
        days: [{ date: "2026-11-08", parentIds: [team[0]] }],
      }),
    );
  });

  it("rejects non-feeding dates and a date listed twice", async () => {
    expectRule(
      await save({
        teamParentIds: [team[0]],
        days: [{ date: "2026-11-12", parentIds: [team[0]] }],
      }),
    );
    expectRule(
      await save({
        teamParentIds: [team[0]],
        days: [
          { date: TUE, parentIds: [team[0]] },
          { date: TUE, parentIds: [] },
        ],
      }),
    );
  });

  it("rejects a bad body with the standard error shape", async () => {
    const res = await teacher.put(URL).send({ week: WEEK, days: "x" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error.code", "VALIDATION_ERROR");
  });

  it("a failed save leaves the earlier week whole (rollback)", async () => {
    await save({
      teamParentIds: [team[0]],
      days: [{ date: TUE, parentIds: [team[0]] }],
    });
    const repository = createAssignmentsRepository(prisma);
    // A parent id that does not exist fails on the foreign key, after the
    // deletes in the same transaction have run.
    await expect(
      repository.saveWeek({
        centerId: world.centerA.id,
        monday: WEEK,
        sunday: "2026-11-15",
        teamParentIds: [999_999],
        days: [{ date: TUE, parentIds: [999_999] }],
        assignedBy: world.teacherA.id,
      }),
    ).rejects.toThrow();
    const rows = await prisma.feedingAssignment.findMany();
    expect(rows.map((row) => row.parentId)).toEqual([team[0]]);
    const { data } = (await teacher.get(`${URL}?week=${WEEK}`))
      .body as WeekBody;
    expect(data.team.map((row) => row.id)).toEqual([team[0]]);
  });
});

describe("the per-day PUT keeps to D4", () => {
  it("cannot bring a 5th parent into the week", async () => {
    await save({ teamParentIds: team.slice(0, 4), days: [] });
    const res = await teacher
      .put(`/api/assignments/${TUE}`)
      .send({ parentIds: [team[4]] });
    expect(res.status).toBe(422);
    expect(await assignmentRows()).toBe(0);
  });

  it("adds a new parent to the team when there is room", async () => {
    const res = await teacher
      .put(`/api/assignments/${TUE}`)
      .send({ parentIds: [team[0]] });
    expect(res.status).toBe(200);
    const { data } = (await teacher.get(`${URL}?week=${WEEK}`))
      .body as WeekBody;
    expect(data.team.map((row) => row.id)).toEqual([team[0]]);
  });
});

describe("what a Parent sees of the calendar (D2)", () => {
  type ScheduleRow = {
    date: string;
    menuName: string;
    assigned: boolean;
    status: string | null;
    parents: { fullName: string }[];
  };
  const SCHEDULE = "/api/parent-schedule?from=2026-11-09&to=2026-11-15";

  it("all menus of the range, names of the assigned parents, own days marked", async () => {
    await save({
      teamParentIds: [team[0], team[1]],
      days: [
        { date: TUE, parentIds: [team[0]] },
        { date: WED, parentIds: [team[1]] },
      ],
    });
    await teacher.post(`/api/purchase-requests/${WED}/open`);
    const parent = await loginAs(app, "parent.a");
    const res = await parent.get(SCHEDULE);
    expect(res.status).toBe(200);
    const rows = (res.body as { data: ScheduleRow[] }).data;
    expect(rows.map((row) => row.date)).toEqual(["2026-11-09", TUE, WED]);
    expect(rows.map((row) => row.assigned)).toEqual([false, true, false]);
    expect(rows[2]?.menuName).toBe("EGG CALDERETA");
    expect(rows[1]?.parents.map((row) => row.fullName)).toEqual([
      "parent.a Test",
    ]);
    expect(rows[2]?.parents.map((row) => row.fullName)).toEqual([
      "parent.c1 Test",
    ]);
  });

  it("the status of a day shows only when assigned", async () => {
    await save({
      teamParentIds: [team[1]],
      days: [{ date: WED, parentIds: [team[1]] }],
    });
    await teacher.post(`/api/purchase-requests/${WED}/open`);
    const parent = await loginAs(app, "parent.a");
    const rows = ((await parent.get(SCHEDULE)).body as { data: ScheduleRow[] })
      .data;
    expect(rows.find((row) => row.date === WED)?.status).toBe(null);
  });

  it("never carries budget fields or a parent's contact details", async () => {
    await save({
      teamParentIds: [team[0]],
      days: [{ date: TUE, parentIds: [team[0]] }],
    });
    const parent = await loginAs(app, "parent.a");
    const text = JSON.stringify((await parent.get(SCHEDULE)).body);
    for (const field of [
      "budget",
      "enrolledCount",
      "ratePerChild",
      "mobile",
      "username",
    ]) {
      expect(text).not.toContain(field);
    }
  });

  it("an unassigned day's purchase request stays 404", async () => {
    await save({
      teamParentIds: [team[1]],
      days: [{ date: WED, parentIds: [team[1]] }],
    });
    const parent = await loginAs(app, "parent.a");
    expect((await parent.get(`/api/purchase-requests/${WED}`)).status).toBe(
      404,
    );
  });

  it("names stay inside the center", async () => {
    await save({
      teamParentIds: [team[0]],
      days: [{ date: TUE, parentIds: [team[0]] }],
    });
    const other = await loginAs(app, "parent.b");
    const rows = ((await other.get(SCHEDULE)).body as { data: ScheduleRow[] })
      .data;
    expect(rows.find((row) => row.date === TUE)?.parents).toEqual([]);
    expect(rows.find((row) => row.date === TUE)?.assigned).toBe(false);
  });

  it("refuses a range over 62 days or backwards", async () => {
    const parent = await loginAs(app, "parent.a");
    expect(
      (await parent.get("/api/parent-schedule?from=2026-01-01&to=2026-12-31"))
        .status,
    ).toBe(400);
    expect(
      (await parent.get("/api/parent-schedule?from=2026-11-30&to=2026-11-01"))
        .status,
    ).toBe(400);
  });
});

describe("Parent rows (D3)", () => {
  type Item = { id: number; version: number; canDelete: boolean };
  const PR = `/api/purchase-requests/${TUE}`;
  let parent: Agent;
  let otherParent: Agent;

  beforeEach(async () => {
    const saved = await save({
      teamParentIds: [team[0], team[1]],
      days: [{ date: TUE, parentIds: [team[0], team[1]] }],
    });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    parent = await loginAs(app, "parent.a");
    otherParent = await loginAs(app, "parent.c1");
  });

  async function addAs(agent: Agent, description: string): Promise<Item> {
    const res = await agent.post(`${PR}/items`).send({ description });
    expect(res.status).toBe(201);
    return (res.body as { data: Item }).data;
  }

  it("a Parent adds a row, which keeps who created it", async () => {
    const item = await addAs(parent, "Rice");
    expect(item.canDelete).toBe(true);
    const row = await prisma.purchaseItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(row.createdBy).toBe(team[0]);
  });

  it("a Parent's first row opens a day that was not opened", async () => {
    const before = await parent.get(PR);
    expect((before.body as { data: { status: string } }).data.status).toBe(
      "NOT_OPENED",
    );
    await addAs(parent, "Rice");
    const after = await parent.get(PR);
    expect((after.body as { data: { status: string } }).data.status).toBe(
      "OPEN",
    );
  });

  it("a Parent edits any row on an assigned day, description included", async () => {
    const item = await addAs(teacher, "Rice");
    const res = await parent
      .patch(`/api/purchase-items/${String(item.id)}`)
      .send({
        version: item.version,
        description: "Brown rice",
        unit: "kg",
        quantity: "2",
        unitCost: "38.00",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data.description", "Brown rice");
    expect(res.body).toHaveProperty("data.total", "76.00");
  });

  it("a Parent deletes only their own rows", async () => {
    const own = await addAs(parent, "Rice");
    const others = await addAs(otherParent, "Oil");
    const teachers = await addAs(teacher, "Salt");

    expect(
      (await parent.delete(`/api/purchase-items/${String(others.id)}`)).status,
    ).toBe(403);
    expect(
      (await parent.delete(`/api/purchase-items/${String(teachers.id)}`))
        .status,
    ).toBe(403);
    expect(
      (await parent.delete(`/api/purchase-items/${String(own.id)}`)).status,
    ).toBe(200);
    expect(await prisma.purchaseItem.count()).toBe(2);
  });

  it("the Teacher can delete any row", async () => {
    const parents = await addAs(parent, "Rice");
    expect(
      (await teacher.delete(`/api/purchase-items/${String(parents.id)}`))
        .status,
    ).toBe(200);
  });

  it("canDelete follows the same rule for the reader", async () => {
    await addAs(parent, "Rice");
    await addAs(teacher, "Salt");
    const forParent = (await parent.get(PR)).body as {
      data: { items: Item[] };
    };
    expect(forParent.data.items.map((row) => row.canDelete)).toEqual([
      true,
      false,
    ]);
    const forTeacher = (await teacher.get(PR)).body as {
      data: { items: Item[] };
    };
    expect(forTeacher.data.items.map((row) => row.canDelete)).toEqual([
      true,
      true,
    ]);
  });

  it("an unassigned Parent cannot add, edit or delete", async () => {
    const item = await addAs(teacher, "Rice");
    const stranger = await loginAs(app, "parent.c2");
    expect(
      (await stranger.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(404);
    expect(
      (
        await stranger
          .patch(`/api/purchase-items/${String(item.id)}`)
          .send({ version: item.version, quantity: "2" })
      ).status,
    ).toBe(404);
    expect(
      (await stranger.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(404);
  });

  it("a Parent of another center gets 404", async () => {
    const item = await addAs(teacher, "Rice");
    const other = await loginAs(app, "parent.b");
    expect(
      (await other.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(404);
    expect(
      (await other.delete(`/api/purchase-items/${String(item.id)}`)).status,
    ).toBe(404);
  });

  it("a locked day blocks every Parent change", async () => {
    const own = await addAs(parent, "Rice");
    await teacher.post(`${PR}/lock`);
    expect(
      (await parent.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(409);
    expect(
      (
        await parent
          .patch(`/api/purchase-items/${String(own.id)}`)
          .send({ version: own.version, quantity: "2" })
      ).status,
    ).toBe(409);
    expect(
      (await parent.delete(`/api/purchase-items/${String(own.id)}`)).status,
    ).toBe(409);
  });

  it("a submitted day blocks every Parent change", async () => {
    await prisma.setting.createMany({
      data: [
        { key: "currentSchoolYear", value: "2026-2027" },
        { key: "perChildDailyRate", value: "25.00" },
      ],
      skipDuplicates: true,
    });
    const own = await addAs(parent, "Rice");
    await teacher
      .patch(`/api/purchase-items/${String(own.id)}`)
      .send({ version: own.version, unit: "kg", quantity: "1", unitCost: "1" });
    await teacher.post(`${PR}/lock`);
    const submitted = await teacher
      .post("/api/liquidation/submit")
      .send({ from: TUE, to: TUE });
    expect(submitted.status).toBe(201);

    expect(
      (await parent.post(`${PR}/items`).send({ description: "Oil" })).status,
    ).toBe(409);
    expect(
      (await parent.delete(`/api/purchase-items/${String(own.id)}`)).status,
    ).toBe(409);
  });

  it("a stale version from a Parent is 409", async () => {
    const item = await addAs(parent, "Rice");
    await teacher
      .patch(`/api/purchase-items/${String(item.id)}`)
      .send({ version: item.version, quantity: "2" });
    const stale = await parent
      .patch(`/api/purchase-items/${String(item.id)}`)
      .send({ version: item.version, quantity: "9" });
    expect(stale.status).toBe(409);
  });

  it("budget fields never reach a Parent after any row change", async () => {
    const added = await parent
      .post(`${PR}/items`)
      .send({ description: "Rice" });
    const read = await parent.get(PR);
    for (const body of [added.body, read.body]) {
      const text = JSON.stringify(body);
      for (const field of ["budget", "enrolledCount", "ratePerChild"]) {
        expect(text).not.toContain(field);
      }
    }
  });
});
