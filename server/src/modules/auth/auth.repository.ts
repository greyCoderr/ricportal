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

    // A lock that has run out starts a new count.
    releaseExpiredLock(id: number, at: Date) {
      return prisma.user.updateMany({
        where: { id, lockedUntil: { lte: at } },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    },

    // Takes one login attempt, in one statement, so attempts made at the same
    // moment cannot share one (AUD-001). False when none is left.
    takeLoginAttempt(id: number, max: number) {
      return prisma.user
        .updateMany({
          where: { id, lockedUntil: null, failedLoginCount: { lt: max } },
          data: { failedLoginCount: { increment: 1 } },
        })
        .then((result) => result.count === 1);
    },

    // Locks the account once every attempt is taken. Safe to repeat.
    lockWhenSpent(id: number, max: number, lockedUntil: Date) {
      return prisma.user.updateMany({
        where: { id, lockedUntil: null, failedLoginCount: { gte: max } },
        data: { lockedUntil },
      });
    },

    findLockedUntil(id: number) {
      return prisma.user
        .findUnique({ where: { id }, select: { lockedUntil: true } })
        .then((row) => row?.lockedUntil ?? null);
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

    // Plan 4 D9: the Teacher's own liquidation reports, in the center the
    // Teacher belongs to now. Reports made in an earlier center stay with that
    // center (BR-02, AUD-021).
    countOwnLiquidation(
      teacherId: number,
      centerId: number,
      status?: "SUBMITTED" | "NEED_REVISION",
    ) {
      return prisma.report.count({
        where: {
          teacherId,
          centerId,
          type: "LIQUIDATION",
          ...(status === undefined ? {} : { status }),
        },
      });
    },

    listOwnLiquidation(
      teacherId: number,
      centerId: number,
      skip: number,
      take: number,
    ) {
      return prisma.report.findMany({
        where: { teacherId, centerId, type: "LIQUIDATION" },
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
    listOwnReportHistory(teacherId: number, centerId: number) {
      return prisma.report.findMany({
        where: { teacherId, centerId, type: "LIQUIDATION" },
        select: {
          id: true,
          submittedAt: true,
          snapshots: { select: { versionNo: true, createdAt: true } },
          reviews: { select: { id: true, decision: true, createdAt: true } },
        },
      });
    },

    // Every session token of the user stops working (AUD-012).
    endSessions(id: number) {
      return prisma.user.update({
        where: { id },
        data: { tokenVersion: { increment: 1 } },
        select: { id: true },
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
