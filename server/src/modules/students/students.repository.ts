import type { Gender, StudentStatus } from "@ricportal/shared";
import { toDbDate } from "../../core/dates.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export type StudentWrite = {
  lastName: string;
  firstName: string;
  middleName: string | null;
  gender: Gender;
  birthdate: string;
  weightKg: string;
  heightCm: string;
  parentGuardianName: string;
  enrolledOn: string;
  birthOrder: number | null;
  numberOfSiblings: number | null;
  religion: string | null;
  ethnicity: string | null;
};

function dbFields(data: StudentWrite) {
  return {
    ...data,
    birthdate: toDbDate(data.birthdate),
    enrolledOn: toDbDate(data.enrolledOn),
  };
}

export function createStudentsRepository(prisma: PrismaClient) {
  return {
    async list(input: {
      centerId: number | null;
      schoolYear: string;
      q?: string | undefined;
      gender?: Gender | undefined;
      status?: StudentStatus | undefined;
      skip: number;
      take: number;
    }) {
      const where = {
        schoolYear: input.schoolYear,
        ...(input.centerId === null ? {} : { centerId: input.centerId }),
        ...(input.gender === undefined ? {} : { gender: input.gender }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.q === undefined || input.q === ""
          ? {}
          : {
              OR: [
                { lastName: { contains: input.q } },
                { firstName: { contains: input.q } },
                { middleName: { contains: input.q } },
              ],
            }),
      };
      const [rows, total] = await prisma.$transaction([
        prisma.student.findMany({
          where,
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          skip: input.skip,
          take: input.take,
        }),
        prisma.student.count({ where }),
      ]);
      return { rows, total };
    },

    findById(id: number) {
      return prisma.student.findUnique({ where: { id } });
    },

    findDuplicate(input: {
      centerId: number;
      schoolYear: string;
      lastName: string;
      firstName: string;
      birthdate: string;
    }) {
      return prisma.student.findUnique({
        where: {
          centerId_schoolYear_lastName_firstName_birthdate: {
            ...input,
            birthdate: toDbDate(input.birthdate),
          },
        },
        select: { id: true },
      });
    },

    create(centerId: number, schoolYear: string, data: StudentWrite) {
      return prisma.student.create({
        data: { centerId, schoolYear, ...dbFields(data) },
      });
    },

    update(id: number, data: StudentWrite) {
      return prisma.student.update({ where: { id }, data: dbFields(data) });
    },

    setStatus(id: number, status: StudentStatus) {
      return prisma.student.update({ where: { id }, data: { status } });
    },

    // Active children only: archived ones leave the summary and the form.
    listActive(input: { centerId: number | null; schoolYear: string }) {
      return prisma.student.findMany({
        where: {
          schoolYear: input.schoolYear,
          status: "ACTIVE",
          ...(input.centerId === null ? {} : { centerId: input.centerId }),
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    },

    findCenter(id: number) {
      return prisma.center.findUnique({
        where: { id },
        select: { id: true, name: true, barangay: true },
      });
    },

    findActiveTeacherName(centerId: number) {
      return prisma.user
        .findFirst({
          where: { centerId, role: "TEACHER", status: "ACTIVE" },
          select: { fullName: true },
        })
        .then((row) => row?.fullName ?? null);
    },
  };
}

export type StudentsRepository = ReturnType<typeof createStudentsRepository>;
