import { toDbDate } from "../../core/dates.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

// Soft delete (BR-22): deleted entries are never read back.
const LIVE = { deletedAt: null };
const STUDENT_CENTER = { student: { select: { centerId: true } } } as const;

export function createChildRecordsRepository(prisma: PrismaClient) {
  return {
    listConferences(studentId: number) {
      return prisma.conferenceNote.findMany({
        where: { studentId, ...LIVE },
        orderBy: [{ noteDate: "desc" }, { id: "desc" }],
      });
    },
    createConference(data: {
      studentId: number;
      createdBy: number;
      noteDate: string;
      noteTime: string | null;
      notes: string;
    }) {
      return prisma.conferenceNote.create({
        data: { ...data, noteDate: toDbDate(data.noteDate) },
      });
    },
    findConference(id: number) {
      return prisma.conferenceNote.findFirst({
        where: { id, ...LIVE },
        include: STUDENT_CENTER,
      });
    },
    updateConference(
      id: number,
      data: { noteDate?: string; noteTime?: string; notes?: string },
    ) {
      return prisma.conferenceNote.update({
        where: { id },
        data: {
          ...data,
          ...(data.noteDate === undefined
            ? {}
            : { noteDate: toDbDate(data.noteDate) }),
        },
      });
    },
    deleteConference(id: number, at: Date) {
      return prisma.conferenceNote.update({
        where: { id },
        data: { deletedAt: at },
        select: { id: true },
      });
    },

    listHomeVisits(studentId: number) {
      return prisma.homeVisit.findMany({
        where: { studentId, ...LIVE },
        orderBy: [{ visitDate: "desc" }, { id: "desc" }],
      });
    },
    createHomeVisit(data: {
      studentId: number;
      createdBy: number;
      visitDate: string;
      observation: string;
      parentInfo: string | null;
      remarks: string | null;
    }) {
      return prisma.homeVisit.create({
        data: { ...data, visitDate: toDbDate(data.visitDate) },
      });
    },
    findHomeVisit(id: number) {
      return prisma.homeVisit.findFirst({
        where: { id, ...LIVE },
        include: STUDENT_CENTER,
      });
    },
    updateHomeVisit(
      id: number,
      data: {
        visitDate?: string;
        observation?: string;
        parentInfo?: string;
        remarks?: string;
      },
    ) {
      return prisma.homeVisit.update({
        where: { id },
        data: {
          ...data,
          ...(data.visitDate === undefined
            ? {}
            : { visitDate: toDbDate(data.visitDate) }),
        },
      });
    },
    deleteHomeVisit(id: number, at: Date) {
      return prisma.homeVisit.update({
        where: { id },
        data: { deletedAt: at },
        select: { id: true },
      });
    },

    listProgress(studentId: number) {
      return prisma.childProgress.findMany({
        where: { studentId, ...LIVE },
        orderBy: [{ noteDate: "desc" }, { id: "desc" }],
      });
    },
    createProgress(data: {
      studentId: number;
      createdBy: number;
      noteDate: string;
      progressNotes: string;
    }) {
      return prisma.childProgress.create({
        data: { ...data, noteDate: toDbDate(data.noteDate) },
      });
    },
    findProgress(id: number) {
      return prisma.childProgress.findFirst({
        where: { id, ...LIVE },
        include: STUDENT_CENTER,
      });
    },
    updateProgress(
      id: number,
      data: { noteDate?: string; progressNotes?: string },
    ) {
      return prisma.childProgress.update({
        where: { id },
        data: {
          ...data,
          ...(data.noteDate === undefined
            ? {}
            : { noteDate: toDbDate(data.noteDate) }),
        },
      });
    },
    deleteProgress(id: number, at: Date) {
      return prisma.childProgress.update({
        where: { id },
        data: { deletedAt: at },
        select: { id: true },
      });
    },
  };
}

export type ChildRecordsRepository = ReturnType<
  typeof createChildRecordsRepository
>;
