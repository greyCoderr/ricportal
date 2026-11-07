import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { manilaToday, mondayOf, addDays } from "@ricportal/shared";
import { hashPassword } from "../src/core/password.js";
import type { AuthUser } from "../src/core/scope.js";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createAssignmentsRepository } from "../src/modules/assignments/assignments.repository.js";
import { createAssignmentsService } from "../src/modules/assignments/assignments.service.js";
import { createMenuRepository } from "../src/modules/menu/menu.repository.js";
import { createMenuService } from "../src/modules/menu/menu.service.js";
import { createPurchaseRequestsRepository } from "../src/modules/purchase-requests/purchase-requests.repository.js";
import { createPurchaseRequestsService } from "../src/modules/purchase-requests/purchase-requests.service.js";
import { createSettingsRepository } from "../src/modules/settings/settings.repository.js";

// The demo state (sprint plan S6). Everything here is fake and local only.
const DEMO_PASSWORD = "Demo2026!";
const CENTER = "Sibujo";
const TEACHER = { username: "teacher.sibujo", fullName: "Ana Cruz" };
const PARENTS = [
  { username: "parent1", fullName: "Rosa Dela Cruz", childName: "Maria" },
  { username: "parent2", fullName: "Lito Santos", childName: "Jose" },
  { username: "parent3", fullName: "Nena Bautista", childName: "Ana" },
];
// The account the demo script's step 2 creates, removed so it can be redone.
const LIVE_DEMO_TEACHER = "teacher.bahay";

const FIXTURE = fileURLToPath(
  new URL("../test/fixtures/SF_MENU_for_30_days.xlsx", import.meta.url),
);

type Child = [string, string, string | null, "M" | "F", string];
const CHILDREN: Child[] = [
  ["Dela Cruz", "Maria", "Santos", "F", "2023-03-14"],
  ["Santos", "Jose", "Reyes", "M", "2022-06-05"],
  ["Bautista", "Ana", "Lopez", "F", "2023-07-22"],
  ["Reyes", "Miguel", null, "M", "2024-01-18"],
  ["Garcia", "Sofia", "Cruz", "F", "2022-05-30"],
  ["Mendoza", "Paolo", "Ramos", "M", "2023-05-09"],
  ["Torres", "Angela", null, "F", "2024-02-27"],
  ["Flores", "Gabriel", "Rivera", "M", "2023-09-11"],
  ["Ramos", "Isabel", "Aquino", "F", "2022-02-19"],
  ["Aquino", "Rafael", "Castro", "M", "2024-04-03"],
  ["Castro", "Camille", null, "F", "2023-01-25"],
  ["Rivera", "Niño", "Villanueva", "M", "2023-10-08"],
  ["Villanueva", "Bea", "Gomez", "F", "2024-06-16"],
  ["Gomez", "Andres", "Pascual", "M", "2023-04-29"],
  ["Pascual", "Lea", null, "F", "2022-08-21"],
  ["Navarro", "Marco", "Domingo", "M", "2024-03-07"],
  ["Domingo", "Clarisse", "Navarro", "F", "2023-08-13"],
  ["Peña", "Carlo", "Salazar", "M", "2024-05-20"],
];

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

async function clearDemoData(prisma: PrismaClient, centerId: number) {
  const students = { student: { centerId } };
  await prisma.conferenceNote.deleteMany({ where: students });
  await prisma.homeVisit.deleteMany({ where: students });
  await prisma.childProgress.deleteMany({ where: students });
  await prisma.student.deleteMany({ where: { centerId } });
  await prisma.feedingAssignment.deleteMany({ where: { centerId } });
  await prisma.weekTeamMember.deleteMany({ where: { centerId } });
  // Items go with their Purchase Request.
  await prisma.purchaseRequest.deleteMany({ where: { centerId } });
  const report = { report: { centerId } };
  await prisma.reportReview.deleteMany({ where: report });
  await prisma.liquidationSnapshot.deleteMany({ where: report });
  await prisma.report.deleteMany({ where: { centerId } });
  await prisma.user.deleteMany({ where: { centerId, role: "PARENT" } });
  await prisma.user.deleteMany({
    where: { centerId, role: "TEACHER", username: { not: TEACHER.username } },
  });
  await prisma.user.deleteMany({ where: { username: LIVE_DEMO_TEACHER } });
}

export async function seedDemo(
  prisma: PrismaClient,
  options: { now: Date; bcryptCost: number },
) {
  const now = () => options.now;
  const center = await prisma.center.findUniqueOrThrow({
    where: { name: CENTER },
  });
  const admin = await prisma.user.findFirstOrThrow({
    where: { role: "ADMIN" },
  });
  await clearDemoData(prisma, center.id);

  // Accounts: fresh passwords, no locks, and old sessions end.
  const passwordHash = await hashPassword(DEMO_PASSWORD, options.bcryptCost);
  const unlocked = { failedLoginCount: 0, lockedUntil: null };
  await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: unlocked,
  });
  const teacherRow = await prisma.user.upsert({
    where: { username: TEACHER.username },
    create: {
      role: "TEACHER",
      status: "ACTIVE",
      username: TEACHER.username,
      fullName: TEACHER.fullName,
      centerId: center.id,
      passwordHash,
    },
    update: {
      ...unlocked,
      status: "ACTIVE",
      fullName: TEACHER.fullName,
      centerId: center.id,
      passwordHash,
      mustChangePassword: false,
      tokenVersion: { increment: 1 },
    },
  });
  const parentRows = [];
  for (const parent of PARENTS) {
    parentRows.push(
      await prisma.user.create({
        data: {
          role: "PARENT",
          status: "ACTIVE",
          username: parent.username,
          fullName: parent.fullName,
          mobile: "09171234567",
          centerId: center.id,
          passwordHash,
          parentProfile: { create: { childName: parent.childName } },
        },
      }),
    );
  }

  const settings = createSettingsRepository(prisma);
  const schoolYear = await settings.currentSchoolYear();
  await prisma.student.createMany({
    data: CHILDREN.map(
      ([lastName, firstName, middleName, gender, birthdate]) => ({
        centerId: center.id,
        schoolYear,
        lastName,
        firstName,
        middleName,
        gender,
        birthdate: day(birthdate),
        weightKg: "14.50",
        heightCm: "96.5",
        parentGuardianName: "Rosa Dela Cruz",
        enrolledOn: day("2026-06-08"),
      }),
    ),
  });

  // The menu goes through the real service. It stays if already imported.
  if ((await prisma.menuDay.count()) === 0) {
    const menu = createMenuService({
      repository: createMenuRepository(prisma),
      now,
    });
    const preview = await menu.preview({
      buffer: readFileSync(FIXTURE),
      fileName: "SF_MENU_for_30_days.xlsx",
      uploadedBy: admin.id,
    });
    if (preview.token === null) {
      throw new Error("The menu fixture could not be imported.");
    }
    await menu.confirm(preview.token);
  }

  const teacher: AuthUser = {
    id: teacherRow.id,
    role: "TEACHER",
    centerId: center.id,
    mustChangePassword: false,
  };

  // This week and next week, so a demo after the weekend still has a schedule.
  const assignments = createAssignmentsService(
    createAssignmentsRepository(prisma),
  );
  const monday = mondayOf(manilaToday(options.now));
  let turn = 0;
  const feedingDays: string[] = [];
  for (const start of [monday, addDays(monday, 7)]) {
    for (const row of await assignments.week(teacher, start)) {
      if (row.menuName !== null) {
        feedingDays.push(row.date);
        const parent = parentRows[turn % parentRows.length];
        turn += 1;
        if (parent !== undefined) {
          await assignments.replace(teacher, row.date, [parent.id]);
        }
      }
    }
  }

  // One locked day, one partly filled, one with only the list.
  const purchase = createPurchaseRequestsService({
    repository: createPurchaseRequestsRepository(prisma),
    settings,
    now,
  });
  const [lockedDay, partlyDay, listDay] = feedingDays;
  async function addRows(
    date: string,
    rows: [string, string | null, string | null, string | null][],
  ) {
    for (const [description, unit, quantity, unitCost] of rows) {
      const item = await purchase.addItem(teacher, date, description);
      if (unit !== null) {
        await purchase.updateItem(teacher, item.id, {
          version: item.version,
          unit: unit as "kg",
          quantity,
          unitCost,
        });
      }
    }
  }
  if (lockedDay !== undefined) {
    await addRows(lockedDay, [
      ["Rice", "kg", "2", "38.00"],
      ["Pork", "kg", "0.5", "340.00"],
      ["Cooking oil", "bottle", "0.25", "80.00"],
    ]);
    await purchase.lock(teacher, lockedDay);
  }
  if (partlyDay !== undefined) {
    await addRows(partlyDay, [
      ["Rice", "kg", "2", "38.00"],
      ["Chicken", "kg", "1", null],
      ["Malunggay leaves", null, null, null],
    ]);
  }
  if (listDay !== undefined) {
    await addRows(listDay, [
      ["Eggs", null, null, null],
      ["Tomato sauce", null, null, null],
    ]);
  }

  return {
    children: CHILDREN.length,
    assignedDays: feedingDays.length,
  };
}
