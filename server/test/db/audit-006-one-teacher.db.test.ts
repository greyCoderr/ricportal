import { Writable } from "node:stream";
import { pino } from "pino";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createCenter,
  createUser,
  loginAs,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-006 (docs/AUDIT_REPORT.md): a center never ends up with two active
// Teachers (A-02, BR-04), also when two requests arrive at the same moment.

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let logged: string[];

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  logged = [];
  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      logged.push(chunk.toString());
      done();
    },
  });
  app = buildApp(prisma, { logger: pino({ level: "error" }, sink) });
  await seedWorld(prisma);
});

// The codes of the errors the server logged, to show what a 500 was.
function loggedCodes(): string[] {
  return logged
    .join("")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      const entry = JSON.parse(line) as {
        err?: { code?: string; name?: string; type?: string };
      };
      return `${entry.err?.type ?? entry.err?.name ?? "?"}:${entry.err?.code ?? "?"}`;
    });
}

describe("one active Teacher per center, also at the same moment (A-02, AUD-006)", () => {
  it("two Teachers created at once for one center: one 201, one 409", async () => {
    const admin = await loginAs(app, "admin.t");
    for (let round = 0; round < 4; round += 1) {
      const center = await createCenter(prisma, `Center New ${String(round)}`);
      const create = (username: string) =>
        admin.post("/api/teachers").send({
          fullName: "New Teacher",
          username,
          centerId: center.id,
        });
      const statuses = (
        await Promise.all([
          create(`first.t${String(round)}`),
          create(`second.t${String(round)}`),
        ])
      )
        .map((res) => res.status)
        .sort();
      expect(statuses, loggedCodes().join(" ")).toEqual([201, 409]);
      expect(
        await prisma.user.count({
          where: { centerId: center.id, role: "TEACHER", status: "ACTIVE" },
        }),
      ).toBe(1);
    }
  }, 60_000);

  it("two disabled Teachers of one center enabled at once: one 200, one 409", async () => {
    const admin = await loginAs(app, "admin.t");
    for (let round = 0; round < 4; round += 1) {
      const center = await createCenter(prisma, `Center Old ${String(round)}`);
      const ids: number[] = [];
      for (const name of ["one", "two"]) {
        const user = await createUser(prisma, {
          username: `${name}.d${String(round)}`,
          role: "TEACHER",
          centerId: center.id,
          status: "DISABLED",
        });
        ids.push(user.id);
      }
      const statuses = (
        await Promise.all(
          ids.map((id) =>
            admin
              .patch(`/api/teachers/${String(id)}`)
              .send({ status: "ACTIVE" }),
          ),
        )
      )
        .map((res) => res.status)
        .sort();
      expect(statuses, loggedCodes().join(" ")).toEqual([200, 409]);
      expect(
        await prisma.user.count({
          where: { centerId: center.id, role: "TEACHER", status: "ACTIVE" },
        }),
      ).toBe(1);
    }
  }, 60_000);
});
