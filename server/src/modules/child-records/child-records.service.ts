import type {
  conferencePatchSchema,
  conferenceSchema,
  ConferenceDto,
  homeVisitPatchSchema,
  homeVisitSchema,
  HomeVisitDto,
  progressPatchSchema,
  progressSchema,
  ProgressDto,
} from "@ricportal/shared";
import type { z } from "zod";
import { fromDbDate } from "../../core/dates.js";
import { NotFoundError } from "../../core/errors.js";
import { assertCenterAccess, type AuthUser } from "../../core/scope.js";
import type { StudentsService } from "../students/students.service.js";
import type { ChildRecordsRepository } from "./child-records.repository.js";

type ConferenceRow = Awaited<
  ReturnType<ChildRecordsRepository["createConference"]>
>;
type HomeVisitRow = Awaited<
  ReturnType<ChildRecordsRepository["createHomeVisit"]>
>;
type ProgressRow = Awaited<
  ReturnType<ChildRecordsRepository["createProgress"]>
>;

function conferenceDto(row: ConferenceRow): ConferenceDto {
  return {
    id: row.id,
    studentId: row.studentId,
    noteDate: fromDbDate(row.noteDate),
    noteTime: row.noteTime,
    notes: row.notes,
  };
}

function homeVisitDto(row: HomeVisitRow): HomeVisitDto {
  return {
    id: row.id,
    studentId: row.studentId,
    visitDate: fromDbDate(row.visitDate),
    observation: row.observation,
    parentInfo: row.parentInfo,
    remarks: row.remarks,
  };
}

function progressDto(row: ProgressRow): ProgressDto {
  return {
    id: row.id,
    studentId: row.studentId,
    noteDate: fromDbDate(row.noteDate),
    progressNotes: row.progressNotes,
  };
}

// Removes undefined keys, so a partial update never clears a column.
function defined<T extends object>(
  input: T,
): {
  [K in keyof T]?: Exclude<T[K], undefined>;
} {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

export function createChildRecordsService(deps: {
  repository: ChildRecordsRepository;
  students: StudentsService;
  now: () => Date;
}) {
  const { repository, students, now } = deps;

  // 404 for an entry that is deleted or belongs to another center.
  function requireEntry<T extends { student: { centerId: number } }>(
    user: AuthUser,
    row: T | null,
  ): T {
    if (row === null) {
      throw new NotFoundError("This entry was not found.");
    }
    assertCenterAccess(user, row.student.centerId);
    return row;
  }

  return {
    async listConferences(user: AuthUser, studentId: number) {
      await students.loadForRead(user, studentId);
      return (await repository.listConferences(studentId)).map(conferenceDto);
    },
    async createConference(
      user: AuthUser,
      studentId: number,
      input: z.output<typeof conferenceSchema>,
    ) {
      await students.loadForRead(user, studentId);
      return conferenceDto(
        await repository.createConference({
          studentId,
          createdBy: user.id,
          noteDate: input.noteDate,
          noteTime: input.noteTime ?? null,
          notes: input.notes,
        }),
      );
    },
    async updateConference(
      user: AuthUser,
      id: number,
      input: z.output<typeof conferencePatchSchema>,
    ) {
      requireEntry(user, await repository.findConference(id));
      return conferenceDto(
        await repository.updateConference(id, defined(input)),
      );
    },
    async deleteConference(user: AuthUser, id: number) {
      requireEntry(user, await repository.findConference(id));
      await repository.deleteConference(id, now());
    },

    async listHomeVisits(user: AuthUser, studentId: number) {
      await students.loadForRead(user, studentId);
      return (await repository.listHomeVisits(studentId)).map(homeVisitDto);
    },
    async createHomeVisit(
      user: AuthUser,
      studentId: number,
      input: z.output<typeof homeVisitSchema>,
    ) {
      await students.loadForRead(user, studentId);
      return homeVisitDto(
        await repository.createHomeVisit({
          studentId,
          createdBy: user.id,
          visitDate: input.visitDate,
          observation: input.observation,
          parentInfo: input.parentInfo ?? null,
          remarks: input.remarks ?? null,
        }),
      );
    },
    async updateHomeVisit(
      user: AuthUser,
      id: number,
      input: z.output<typeof homeVisitPatchSchema>,
    ) {
      requireEntry(user, await repository.findHomeVisit(id));
      return homeVisitDto(await repository.updateHomeVisit(id, defined(input)));
    },
    async deleteHomeVisit(user: AuthUser, id: number) {
      requireEntry(user, await repository.findHomeVisit(id));
      await repository.deleteHomeVisit(id, now());
    },

    async listProgress(user: AuthUser, studentId: number) {
      await students.loadForRead(user, studentId);
      return (await repository.listProgress(studentId)).map(progressDto);
    },
    async createProgress(
      user: AuthUser,
      studentId: number,
      input: z.output<typeof progressSchema>,
    ) {
      await students.loadForRead(user, studentId);
      return progressDto(
        await repository.createProgress({
          studentId,
          createdBy: user.id,
          noteDate: input.noteDate,
          progressNotes: input.progressNotes,
        }),
      );
    },
    async updateProgress(
      user: AuthUser,
      id: number,
      input: z.output<typeof progressPatchSchema>,
    ) {
      requireEntry(user, await repository.findProgress(id));
      return progressDto(await repository.updateProgress(id, defined(input)));
    },
    async deleteProgress(user: AuthUser, id: number) {
      requireEntry(user, await repository.findProgress(id));
      await repository.deleteProgress(id, now());
    },
  };
}

export type ChildRecordsService = ReturnType<typeof createChildRecordsService>;
