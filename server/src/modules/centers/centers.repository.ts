import type { PrismaClient } from "../../generated/prisma/client.js";

const CENTER_SELECT = {
  id: true,
  name: true,
  barangay: true,
  address: true,
  isActive: true,
} as const;

export function createCentersRepository(prisma: PrismaClient) {
  return {
    async list(input: { q?: string | undefined; skip: number; take: number }) {
      const where =
        input.q === undefined ? {} : { name: { contains: input.q } };
      const [rows, total] = await prisma.$transaction([
        prisma.center.findMany({
          where,
          orderBy: { name: "asc" },
          skip: input.skip,
          take: input.take,
          select: CENTER_SELECT,
        }),
        prisma.center.count({ where }),
      ]);
      return { rows, total };
    },

    findById(id: number) {
      return prisma.center.findUnique({
        where: { id },
        select: CENTER_SELECT,
      });
    },

    findByName(name: string) {
      return prisma.center.findUnique({
        where: { name },
        select: { id: true },
      });
    },

    create(data: {
      name: string;
      barangay?: string | undefined;
      address?: string | undefined;
    }) {
      return prisma.center.create({
        data: {
          name: data.name,
          barangay: data.barangay ?? null,
          address: data.address ?? null,
        },
        select: CENTER_SELECT,
      });
    },

    update(
      id: number,
      data: {
        name?: string;
        barangay?: string;
        address?: string;
        isActive?: boolean;
      },
    ) {
      return prisma.center.update({
        where: { id },
        data,
        select: CENTER_SELECT,
      });
    },

    countActiveTeachers(centerId: number) {
      return prisma.user.count({
        where: { centerId, role: "TEACHER", status: "ACTIVE" },
      });
    },
  };
}

export type CentersRepository = ReturnType<typeof createCentersRepository>;
