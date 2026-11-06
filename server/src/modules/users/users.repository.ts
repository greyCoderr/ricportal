import type { UserStatus } from "@ricportal/shared";
import type { PrismaClient } from "../../generated/prisma/client.js";

const TEACHER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  mobile: true,
  status: true,
  centerId: true,
  lastLoginAt: true,
  center: { select: { name: true } },
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

export function createUsersRepository(prisma: PrismaClient) {
  return {
    async listTeachers(input: { skip: number; take: number }) {
      const where = { role: "TEACHER" } as const;
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

    createTeacher(data: {
      username: string;
      passwordHash: string;
      fullName: string;
      mobile: string | undefined;
      centerId: number;
    }) {
      return prisma.user.create({
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
    },

    updateTeacher(
      id: number,
      data: {
        fullName?: string;
        mobile?: string;
        centerId?: number;
        status?: UserStatus;
      },
    ) {
      return prisma.user.update({
        where: { id },
        data,
        select: TEACHER_SELECT,
      });
    },

    // Forces a new password at next login and ends every open session.
    resetPassword(id: number, passwordHash: string) {
      return prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
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
        select: { id: true, fullName: true },
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
