import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  expectNoSecrets,
  loginAs,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Round 3, H3: Child Records (D10) and Export List (D9).

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

type Row = {
  id: number;
  displayName: string;
  records: { conferences: number; homeVisits: number; progress: number };
};

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
});

async function studentIds(centerId: number) {
  const rows = await prisma.student.findMany({
    where: { centerId, status: "ACTIVE" },
    orderBy: { lastName: "asc" },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

async function list(username: string, query = "") {
  const agent = await loginAs(app, username);
  const res = await agent.get(`/api/child-records${query}`);
  expect(res.status).toBe(200);
  return res.body as { data: Row[]; meta: { total: number } };
}

const POSTS = {
  conferences: { noteDate: "2026-11-02", notes: "Talked with the mother." },
  "home-visits": { visitDate: "2026-11-03", observation: "Clean home." },
  progress: { noteDate: "2026-11-04", progressNotes: "Counts to ten." },
};

describe("GET /api/child-records (D10)", () => {
  it("counts each child's live entries, without deleted ones", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    const [first, second] = await studentIds(world.centerA.id);
    const agent = await loginAs(app, "teacher.a");
    const url = (kind: string, id: number | undefined) =>
      `/api/students/${String(id)}/${kind}`;

    const note = await agent
      .post(url("conferences", first))
      .send(POSTS.conferences);
    expect(note.status).toBe(201);
    await agent.post(url("conferences", first)).send(POSTS.conferences);
    await agent.post(url("home-visits", first)).send(POSTS["home-visits"]);
    await agent.post(url("progress", second)).send(POSTS.progress);
    const { id: deletedId } = (note.body as { data: { id: number } }).data;
    expect(
      (await agent.delete(`/api/conferences/${String(deletedId)}`)).status,
    ).toBe(200);

    const { data, meta } = await list("teacher.a");
    expect(meta.total).toBe(2);
    expect(data.find((row) => row.id === first)?.records).toEqual({
      conferences: 1,
      homeVisits: 1,
      progress: 0,
    });
    expect(data.find((row) => row.id === second)?.records).toEqual({
      conferences: 0,
      homeVisits: 0,
      progress: 1,
    });
    expectNoSecrets(data);
  });

  it("lists only the Teacher's own center, whatever centerId is asked", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    await seedStudents(prisma, world.centerB.id, 3, { prefix: "Bee" });
    const own = await list("teacher.a");
    expect(own.meta.total).toBe(2);
    const forced = await list(
      "teacher.a",
      `?centerId=${String(world.centerB.id)}`,
    );
    expect(forced.meta.total).toBe(2);
  });

  it("leaves out archived children", async () => {
    await seedStudents(prisma, world.centerA.id, 1);
    await seedStudents(prisma, world.centerA.id, 2, {
      status: "ARCHIVED",
      prefix: "Arch",
    });
    expect((await list("teacher.a")).meta.total).toBe(1);
  });

  it("is an empty list when the center has no children", async () => {
    const { data, meta } = await list("teacher.a");
    expect(data).toEqual([]);
    expect(meta.total).toBe(0);
  });
});

describe("the Progress entries of another center (D10)", () => {
  it("are out of reach for another Teacher", async () => {
    await seedStudents(prisma, world.centerA.id, 1);
    const [id] = await studentIds(world.centerA.id);
    const owner = await loginAs(app, "teacher.a");
    const created = await owner
      .post(`/api/students/${String(id)}/progress`)
      .send(POSTS.progress);
    expect(created.status).toBe(201);
    const entry = (created.body as { data: { id: number } }).data.id;

    const other = await loginAs(app, "teacher.b");
    const read = await other.get(`/api/students/${String(id)}/progress`);
    expect([403, 404]).toContain(read.status);
    const patch = await other
      .patch(`/api/progress/${String(entry)}`)
      .send({ progressNotes: "Changed." });
    expect([403, 404]).toContain(patch.status);
    const remove = await other.delete(`/api/progress/${String(entry)}`);
    expect([403, 404]).toContain(remove.status);

    const row = await prisma.childProgress.findUniqueOrThrow({
      where: { id: entry },
    });
    expect(row.progressNotes).toBe(POSTS.progress.progressNotes);
    expect(row.deletedAt).toBe(null);
  });
});

describe("Export List (D9)", () => {
  it("returns the Enrollment Form PDF of the current school year", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    const agent = await loginAs(app, "teacher.a");
    const res = await agent
      .get("/api/enrollment-form.pdf")
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          done(null, Buffer.concat(chunks));
        });
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect((res.body as Buffer).subarray(0, 4).toString()).toBe("%PDF");
  });
});
