import type { PrismaClient } from "../../generated/prisma/client.js";

const SESSION_SELECT = {
  id: true,
  role: true,
  username: true,
  fullName: true,
  centerId: true,
  mustChangePassword: true,
  status: true,
  tokenVersion: true,
  center: { select: { name: true } },
} as const;

const PROFILE_SELECT = {
  id: true,
  role: true,
  username: true,
  fullName: true,
  mobile: true,
  centerId: true,
  status: true,
  email: true,
  address: true,
  position: true,
  sex: true,
  birthDate: true,
  qualification: true,
  createdAt: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  center: { select: { name: true } },
} as const;

const LOGIN_HISTORY_SIZE = 10;

export function createAuthRepository(prisma: PrismaClient) {
  return {
    findForLogin(username: string) {
      return prisma.user.findUnique({
        where: { username },
        select: {
          ...SESSION_SELECT,
          passwordHash: true,
          failedLoginCount: true,
          lockedUntil: true,
        },
      });
    },

    findSessionUser(id: number) {
      return prisma.user.findUnique({
        where: { id },
        select: SESSION_SELECT,
      });
    },

    findProfile(id: number) {
      return prisma.user.findUnique({
        where: { id },
        select: PROFILE_SELECT,
      });
    },

    updateProfile(
      id: number,
      input: {
        fullName: string;
        mobile: string | null;
        email?: string | null;
        address?: string | null;
        position?: string | null;
        sex?: string | null;
        birthDate?: Date | null;
        qualification?: string | null;
      },
    ) {
      return prisma.user.update({
        where: { id },
        data: input,
        select: PROFILE_SELECT,
      });
    },

    findPasswordHash(id: number) {
      return prisma.user.findUnique({
        where: { id },
        select: { passwordHash: true },
      });
    },

    recordFailure(id: number, count: number, lockedUntil: Date | null) {
      return prisma.user.update({
        where: { id },
        data: { failedLoginCount: count, lockedUntil },
        select: { id: true },
      });
    },

    clearFailures(id: number) {
      return prisma.user.update({
        where: { id },
        data: { failedLoginCount: 0, lockedUntil: null },
        select: { id: true },
      });
    },

    // One transaction, so last login and the history cannot disagree.
    recordLogin(id: number, at: Date) {
      return prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: at },
          select: { id: true },
        }),
        prisma.loginEvent.create({
          data: { userId: id, createdAt: at },
          select: { id: true },
        }),
      ]);
    },

    countLogins(userId: number, from: Date, to: Date) {
      return prisma.loginEvent.count({
        where: { userId, createdAt: { gte: from, lt: to } },
      });
    },

    listRecentLogins(userId: number) {
      return prisma.loginEvent.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: LOGIN_HISTORY_SIZE,
        select: { createdAt: true },
      });
    },

    countTeachers() {
      return prisma.user.count({ where: { role: "TEACHER" } });
    },

    countEnrolledStudents(schoolYear: string, centerId?: number) {
      return prisma.student.count({
        where: {
          schoolYear,
          status: "ACTIVE",
          ...(centerId === undefined ? {} : { centerId }),
        },
      });
    },

    countLiquidationReports() {
      return prisma.report.count({ where: { type: "LIQUIDATION" } });
    },

    countApprovedParents(centerId: number) {
      return prisma.user.count({
        where: { role: "PARENT", status: "ACTIVE", centerId },
      });
    },

    countCenterReports(centerId: number) {
      return prisma.report.count({ where: { centerId } });
    },

    // Plan 4 D9: the Teacher's own liquidation reports.
    countOwnLiquidation(
      teacherId: number,
      status?: "SUBMITTED" | "NEED_REVISION",
    ) {
      return prisma.report.count({
        where: {
          teacherId,
          type: "LIQUIDATION",
          ...(status === undefined ? {} : { status }),
        },
      });
    },

    listOwnLiquidation(teacherId: number, skip: number, take: number) {
      return prisma.report.findMany({
        where: { teacherId, type: "LIQUIDATION" },
        orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        skip,
        take,
        select: {
          id: true,
          type: true,
          status: true,
          submittedAt: true,
        },
      });
    },

    // Every version and review of the Teacher's liquidation reports, for the
    // status activity. Bounded by the Teacher's own reports.
    listOwnReportHistory(teacherId: number) {
      return prisma.report.findMany({
        where: { teacherId, type: "LIQUIDATION" },
        select: {
          id: true,
          submittedAt: true,
          snapshots: { select: { versionNo: true, createdAt: true } },
          reviews: { select: { id: true, decision: true, createdAt: true } },
        },
      });
    },

    changePassword(id: number, passwordHash: string, at: Date) {
      return prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: false,
          passwordChangedAt: at,
          tokenVersion: { increment: 1 },
        },
        select: SESSION_SELECT,
      });
    },

    findCenter(id: number) {
      return prisma.center.findUnique({
        where: { id },
        select: { id: true, name: true, isActive: true },
      });
    },

    usernameExists(username: string) {
      return prisma.user
        .count({ where: { username } })
        .then((count) => count > 0);
    },

    createParent(input: {
      username: string;
      passwordHash: string;
      fullName: string;
      mobile: string;
      centerId: number;
      childName: string | undefined;
    }) {
      return prisma.user.create({
        data: {
          role: "PARENT",
          status: "PENDING",
          username: input.username,
          passwordHash: input.passwordHash,
          fullName: input.fullName,
          mobile: input.mobile,
          centerId: input.centerId,
          parentProfile: { create: { childName: input.childName ?? null } },
        },
        select: { id: true },
      });
    },

    listActiveCenters() {
      return prisma.center.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
