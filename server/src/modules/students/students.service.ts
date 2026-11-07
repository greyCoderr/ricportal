import {
  ageBucket,
  computeAge,
  isUsualAge,
  manilaToday,
  profileExtraSchema,
  type enrollmentFormQuerySchema,
  type Gender,
  type ProfileExtra,
  type studentCreateSchema,
  type StudentDto,
  type studentListQuerySchema,
  type studentPatchSchema,
  type StudentSummary,
  type StudentSummaryRow,
} from "@ricportal/shared";
import type { z } from "zod";
import { fromDbDate } from "../../core/dates.js";
import {
  ConflictError,
  NotFoundError,
  RuleViolationError,
  ValidationError,
} from "../../core/errors.js";
import {
  assertCenterAccess,
  ownCenterId,
  scopeToCenter,
  type AuthUser,
} from "../../core/scope.js";
import { buildEnrollmentForm } from "../pdf/enrollment-form.js";
import { renderPdf } from "../pdf/pdf.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import type {
  StudentsRepository,
  StudentWrite,
} from "./students.repository.js";

type StudentRow = NonNullable<
  Awaited<ReturnType<StudentsRepository["findById"]>>
>;

const MAX_AGE = 10;

function displayName(row: {
  lastName: string;
  firstName: string;
  middleName: string | null;
}): string {
  const initial =
    row.middleName === null
      ? ""
      : ` ${row.middleName.charAt(0).toUpperCase()}.`;
  return `${row.lastName}, ${row.firstName}${initial}`;
}

// JSON text in the column, validated at the edge (D9). Damaged text reads as
// none, so one bad row cannot break the list.
function readProfileExtra(stored: string | null): ProfileExtra | null {
  if (stored === null) {
    return null;
  }
  try {
    const parsed = profileExtraSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function createStudentsService(deps: {
  repository: StudentsRepository;
  settings: SettingsRepository;
  now: () => Date;
}) {
  const { repository, settings, now } = deps;

  function toDto(row: StudentRow, currentYear: string): StudentDto {
    const birthdate = fromDbDate(row.birthdate);
    const age = computeAge(birthdate, manilaToday(now())) ?? 0;
    return {
      id: row.id,
      centerId: row.centerId,
      schoolYear: row.schoolYear,
      lastName: row.lastName,
      firstName: row.firstName,
      middleName: row.middleName,
      displayName: displayName(row),
      gender: row.gender,
      birthdate,
      age,
      ageWarning: !isUsualAge(age),
      weightKg: row.weightKg.toFixed(2),
      heightCm: row.heightCm.toFixed(1),
      parentGuardianName: row.parentGuardianName,
      enrolledOn: fromDbDate(row.enrolledOn),
      status: row.status,
      birthOrder: row.birthOrder,
      numberOfSiblings: row.numberOfSiblings,
      religion: row.religion,
      ethnicity: row.ethnicity,
      profileExtra: readProfileExtra(row.profileExtra),
      isEditable: row.schoolYear === currentYear,
    };
  }

  function checkBirthdate(birthdate: string): void {
    const age = computeAge(birthdate, manilaToday(now()));
    if (age === null) {
      throw new ValidationError("Some fields are not valid.", [
        { field: "birthdate", message: "The birthdate must be in the past." },
      ]);
    }
    if (age > MAX_AGE) {
      throw new ValidationError("Some fields are not valid.", [
        {
          field: "birthdate",
          message: "The child must be 10 years old or younger.",
        },
      ]);
    }
  }

  async function loadForRead(user: AuthUser, id: number): Promise<StudentRow> {
    const row = await repository.findById(id);
    if (row === null) {
      throw new NotFoundError("This student was not found.");
    }
    assertCenterAccess(user, row.centerId);
    return row;
  }

  // A Teacher writes only in the own center and the current school year.
  async function loadForWrite(user: AuthUser, id: number) {
    const row = await loadForRead(user, id);
    const currentYear = await settings.currentSchoolYear();
    if (row.schoolYear !== currentYear) {
      throw new RuleViolationError(
        `This record belongs to school year ${row.schoolYear} and can no longer be changed.`,
      );
    }
    return { row, currentYear };
  }

  const DUPLICATE = () =>
    new ConflictError(
      "This child is already on the list for this school year.",
      [
        {
          field: "firstName",
          message: "A child with this name and birthdate is already listed.",
        },
      ],
    );

  async function summarize(
    centerId: number | null,
    schoolYear: string,
  ): Promise<StudentSummary> {
    const today = manilaToday(now());
    const counts: Record<
      StudentSummaryRow["bucket"],
      Record<Gender, number>
    > = {
      "2": { M: 0, F: 0 },
      "3": { M: 0, F: 0 },
      "4": { M: 0, F: 0 },
      Other: { M: 0, F: 0 },
    };
    const rows = await repository.listActive({ centerId, schoolYear });
    for (const row of rows) {
      const age = computeAge(fromDbDate(row.birthdate), today) ?? 0;
      counts[ageBucket(age)][row.gender] += 1;
    }
    const buckets = ["2", "3", "4", "Other"] as const;
    const summaryRows = buckets.map((bucket) => ({
      bucket,
      male: counts[bucket].M,
      female: counts[bucket].F,
    }));
    const totalMale = summaryRows.reduce((sum, row) => sum + row.male, 0);
    const totalFemale = summaryRows.reduce((sum, row) => sum + row.female, 0);
    return {
      schoolYear,
      rows: summaryRows,
      totalMale,
      totalFemale,
      total: totalMale + totalFemale,
    };
  }

  return {
    async list(
      user: AuthUser,
      query: z.output<typeof studentListQuerySchema>,
      page: { skip: number; take: number },
    ) {
      const currentYear = await settings.currentSchoolYear();
      const { rows, total } = await repository.list({
        centerId: scopeToCenter(user, query.centerId),
        schoolYear: query.schoolYear ?? currentYear,
        q: query.q,
        gender: query.gender,
        status: query.status,
        ...page,
      });
      return { rows: rows.map((row) => toDto(row, currentYear)), total };
    },

    async get(user: AuthUser, id: number): Promise<StudentDto> {
      return toDto(
        await loadForRead(user, id),
        await settings.currentSchoolYear(),
      );
    },

    async create(
      user: AuthUser,
      input: z.output<typeof studentCreateSchema>,
    ): Promise<StudentDto> {
      checkBirthdate(input.birthdate);
      const centerId = ownCenterId(user);
      const schoolYear = await settings.currentSchoolYear();
      const duplicate = await repository.findDuplicate({
        centerId,
        schoolYear,
        lastName: input.lastName,
        firstName: input.firstName,
        birthdate: input.birthdate,
      });
      if (duplicate !== null) {
        throw DUPLICATE();
      }
      const row = await repository.create(centerId, schoolYear, {
        lastName: input.lastName,
        firstName: input.firstName,
        middleName: input.middleName ?? null,
        gender: input.gender,
        birthdate: input.birthdate,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        parentGuardianName: input.parentGuardianName,
        enrolledOn: input.enrolledOn ?? manilaToday(now()),
        birthOrder: input.birthOrder ?? null,
        numberOfSiblings: input.numberOfSiblings ?? null,
        religion: input.religion ?? null,
        ethnicity: input.ethnicity ?? null,
        profileExtra:
          input.profileExtra === undefined
            ? null
            : JSON.stringify(input.profileExtra),
      });
      return toDto(row, schoolYear);
    },

    async update(
      user: AuthUser,
      id: number,
      input: z.output<typeof studentPatchSchema>,
    ): Promise<StudentDto> {
      const { row, currentYear } = await loadForWrite(user, id);
      const merged: StudentWrite = {
        lastName: input.lastName ?? row.lastName,
        firstName: input.firstName ?? row.firstName,
        middleName: input.middleName ?? row.middleName,
        gender: input.gender ?? row.gender,
        birthdate: input.birthdate ?? fromDbDate(row.birthdate),
        weightKg: input.weightKg ?? row.weightKg.toFixed(2),
        heightCm: input.heightCm ?? row.heightCm.toFixed(1),
        parentGuardianName: input.parentGuardianName ?? row.parentGuardianName,
        enrolledOn: input.enrolledOn ?? fromDbDate(row.enrolledOn),
        birthOrder: input.birthOrder ?? row.birthOrder,
        numberOfSiblings: input.numberOfSiblings ?? row.numberOfSiblings,
        religion: input.religion ?? row.religion,
        ethnicity: input.ethnicity ?? row.ethnicity,
        profileExtra:
          input.profileExtra === undefined
            ? row.profileExtra
            : JSON.stringify(input.profileExtra),
      };
      if (input.birthdate !== undefined) {
        checkBirthdate(input.birthdate);
      }
      const duplicate = await repository.findDuplicate({
        centerId: row.centerId,
        schoolYear: row.schoolYear,
        lastName: merged.lastName,
        firstName: merged.firstName,
        birthdate: merged.birthdate,
      });
      if (duplicate !== null && duplicate.id !== id) {
        throw DUPLICATE();
      }
      return toDto(await repository.update(id, merged), currentYear);
    },

    async setStatus(
      user: AuthUser,
      id: number,
      status: "ACTIVE" | "ARCHIVED",
    ): Promise<StudentDto> {
      const { currentYear } = await loadForWrite(user, id);
      return toDto(await repository.setStatus(id, status), currentYear);
    },

    async summary(
      user: AuthUser,
      query: { schoolYear?: string | undefined; centerId?: number | undefined },
    ): Promise<StudentSummary> {
      return summarize(
        scopeToCenter(user, query.centerId),
        query.schoolYear ?? (await settings.currentSchoolYear()),
      );
    },

    async enrollmentForm(
      user: AuthUser,
      query: z.output<typeof enrollmentFormQuerySchema>,
    ): Promise<Buffer> {
      const centerId = scopeToCenter(user, query.centerId);
      if (centerId === null) {
        throw new ValidationError("Some fields are not valid.", [
          { field: "centerId", message: "Choose a center." },
        ]);
      }
      const center = await repository.findCenter(centerId);
      if (center === null) {
        throw new NotFoundError("This center was not found.");
      }
      const schoolYear =
        query.schoolYear ?? (await settings.currentSchoolYear());
      const today = manilaToday(now());
      const students = await repository.listActive({ centerId, schoolYear });
      return renderPdf(
        buildEnrollmentForm({
          centerName: center.name,
          barangay: center.barangay ?? center.name,
          dateStarted: query.dateStarted ?? null,
          teacherName: await repository.findActiveTeacherName(centerId),
          students: students.map((row) => {
            const birthdate = fromDbDate(row.birthdate);
            return {
              displayName: displayName(row),
              gender: row.gender,
              birthdate,
              age: computeAge(birthdate, today) ?? 0,
              weightKg: row.weightKg.toFixed(2),
              heightCm: row.heightCm.toFixed(1),
              parentGuardianName: row.parentGuardianName,
            };
          }),
        }),
      );
    },

    loadForRead,
    loadForWrite,
  };
}

export type StudentsService = ReturnType<typeof createStudentsService>;
