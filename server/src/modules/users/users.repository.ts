import type { UserStatus } from "@ricportal/shared";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

const TEACHER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  mobile: true,
  status: true,
  centerId: true,
  lastLoginAt: true,
  createdAt: true,
  center: { select: { name: true } },
} as const;

const TEACHER_DETAIL_SELECT = {
  ...TEACHER_SELECT,
  email: true,
  address: true,
  position: true,
  sex: true,
  birthDate: true,
  qualification: true,
} as const;

const PARENT_SELECT = {
  id: true,
  username: true,
  fullName: true,
  mobile: true,
  status: true,
  createdAt: true,
  centerId: true,
  parentProfile: { select: { childName: true } },
} as const;

// Locks the center row until the transaction ends and counts its other active
// Teachers in the same statement. Two requests for one center wait here in
// turn, so both cannot find the place free (A-02, AUD-006).
async function otherActiveTeachers(
  tx: Prisma.TransactionClient,
  centerId: number,
  exceptId: number,
): Promise<number> {
  const rows = await tx.$queryRaw<{ others: number | bigint }[]>`
    SELECT (SELECT COUNT(*) FROM users u
        WHERE u.center_id = c.id AND u.role = 'TEACHER'
          AND u.status = 'ACTIVE' AND u.id <> ${exceptId}) AS others
    FROM centers c
    WHERE c.id = ${centerId}
    FOR UPDATE`;
  return Number(rows[0]?.others ?? 0);
}

export function createUsersRepository(prisma: PrismaClient) {
  return {
    async listTeachers(input: {
      skip: number;
      take: number;
      q?: string | undefined;
      status?: "ACTIVE" | "DISABLED" | undefined;
      centerId?: number | undefined;
    }) {
      const where = {
        role: "TEACHER",
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.centerId === undefined ? {} : { centerId: input.centerId }),
        ...(input.q === undefined || input.q === ""
          ? {}
          : {
              OR: [
                { fullName: { contains: input.q } },
                { username: { contains: input.q } },
              ],
            }),
      } as const;
      const [rows, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          orderBy: { fullName: "asc" },
          skip: input.skip,
          take: input.take,
          select: TEACHER_SELECT,
        }),
        prisma.user.count({ where }),
      ]);
      return { rows, total };
    },

    findTeacher(id: number) {
      return prisma.user.findFirst({
        where: { id, role: "TEACHER" },
        select: TEACHER_SELECT,
      });
    },

    findTeacherDetail(id: number) {
      return prisma.user.findFirst({
        where: { id, role: "TEACHER" },
        select: TEACHER_DETAIL_SELECT,
      });
    },

    usernameExists(username: string) {
      return prisma.user
        .count({ where: { username } })
        .then((count) => count > 0);
    },

    findCenter(id: number) {
      return prisma.center.findUnique({
        where: { id },
        select: { id: true, name: true, isActive: true },
      });
    },

    countOtherActiveTeachers(centerId: number, exceptId?: number) {
      return prisma.user.count({
        where: {
          centerId,
          role: "TEACHER",
          status: "ACTIVE",
          ...(exceptId === undefined ? {} : { id: { not: exceptId } }),
        },
      });
    },

    // Null when the center already has an active Teacher (A-02).
    createTeacher(data: {
      username: string;
      passwordHash: string;
      fullName: string;
      mobile: string | undefined;
      centerId: number;
    }) {
      return prisma.$transaction(async (tx) => {
        if ((await otherActiveTeachers(tx, data.centerId, 0)) > 0) {
          return null;
        }
        return tx.user.create({
          data: {
            role: "TEACHER",
            status: "ACTIVE",
            mustChangePassword: true,
            username: data.username,
            passwordHash: data.passwordHash,
            fullName: data.fullName,
            mobile: data.mobile ?? null,
            centerId: data.centerId,
          },
          select: TEACHER_SELECT,
        });
      });
    },

    // `activeInCenter` is the center the Teacher will be active in after the
    // change, or null when the Teacher will not be active. Null result: that
    // center already has another active Teacher (A-02).
    updateTeacher(
      id: number,
      data: {
        fullName?: string;
        mobile?: string;
        centerId?: number;
        status?: UserStatus;
      },
      activeInCenter: number | null,
    ) {
      return prisma.$transaction(async (tx) => {
        if (
          activeInCenter !== null &&
          (await otherActiveTeachers(tx, activeInCenter, id)) > 0
        ) {
          return null;
        }
        return tx.user.update({
          where: { id },
          data,
          select: TEACHER_SELECT,
        });
      });
    },

    // Forces a new password at next login and ends every open session.
    resetPassword(id: number, passwordHash: string, at: Date) {
      return prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
          passwordChangedAt: at,
          failedLoginCount: 0,
          lockedUntil: null,
          tokenVersion: { increment: 1 },
        },
        select: { id: true },
      });
    },

    async listParents(input: {
      centerId: number;
      status?: UserStatus | undefined;
      skip: number;
      take: number;
    }) {
      const where = {
        role: "PARENT",
        centerId: input.centerId,
        ...(input.status === undefined ? {} : { status: input.status }),
      } as const;
      const [rows, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          orderBy: [{ status: "asc" }, { fullName: "asc" }],
          skip: input.skip,
          take: input.take,
          select: PARENT_SELECT,
        }),
        prisma.user.count({ where }),
      ]);
      return { rows, total };
    },

    listApprovedParents(centerId: number) {
      return prisma.user.findMany({
        where: { centerId, role: "PARENT", status: "ACTIVE" },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, username: true },
      });
    },

    findParentInCenter(id: number, centerId: number) {
      return prisma.user.findFirst({
        where: { id, centerId, role: "PARENT" },
        select: PARENT_SELECT,
      });
    },

    setParentStatus(id: number, status: UserStatus) {
      return prisma.user.update({
        where: { id },
        data: { status },
        select: PARENT_SELECT,
      });
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
