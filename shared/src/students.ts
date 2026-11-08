import { z } from "zod";
import { isCalendarDate } from "./dates.js";
import { profileExtraSchema, type ProfileExtra } from "./profile-extra.js";

export const GENDERS = ["M", "F"] as const;
export type Gender = (typeof GENDERS)[number];
export const STUDENT_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

const NAME = /^[\p{L} .'-]+$/u;

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(60, `The ${label} must be at most 60 characters.`)
    .regex(
      NAME,
      `The ${label} can have letters, spaces, dot, hyphen and apostrophe.`,
    );

export const calendarDateSchema = z
  .string()
  .refine(isCalendarDate, "Enter a valid date.");

const blankToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalInt = (max: number, min: number, message: string) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number(message)
      .int(message)
      .min(min, message)
      .max(max, message)
      .optional(),
  );

const optionalShortText = (label: string) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .max(40, `${label} must be at most 40 characters.`)
      .optional(),
  );

// Measurements travel as decimal strings, like money.
const decimalInRange = (
  min: number,
  max: number,
  places: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{1,3}(\\.\\d{1,${String(places)}})?$`), message)
    .refine((value) => {
      const number = Number(value);
      return number >= min && number <= max;
    }, message);

const studentFields = {
  lastName: personName("last name"),
  firstName: personName("first name"),
  middleName: z.preprocess(
    blankToUndefined,
    personName("middle name").optional(),
  ),
  gender: z.enum(GENDERS, "Choose M or F."),
  birthdate: calendarDateSchema,
  weightKg: decimalInRange(
    3,
    40,
    2,
    "Weight must be 3 to 40 kg, with up to 2 decimals.",
  ),
  heightCm: decimalInRange(
    40,
    140,
    1,
    "Height must be 40 to 140 cm, with 1 decimal.",
  ),
  parentGuardianName: z
    .string()
    .trim()
    .min(2, "Enter the parent or guardian name.")
    .max(100, "The parent or guardian name must be at most 100 characters."),
  enrolledOn: z.preprocess(blankToUndefined, calendarDateSchema.optional()),
  birthOrder: optionalInt(20, 1, "Birth order must be 1 to 20."),
  numberOfSiblings: optionalInt(20, 0, "Number of siblings must be 0 to 20."),
  religion: optionalShortText("Religion"),
  ethnicity: optionalShortText("Ethnicity"),
  profileExtra: profileExtraSchema.optional(),
};

export const studentCreateSchema = z.object(studentFields);
export type StudentCreateInput = z.input<typeof studentCreateSchema>;

export const studentPatchSchema = z.object(studentFields).partial();
export type StudentPatchInput = z.input<typeof studentPatchSchema>;

export const schoolYearSchema = z
  .string()
  .regex(/^\d{4}-\d{4}$/, "A school year looks like 2026-2027.");

export const studentListQuerySchema = z.object({
  schoolYear: schoolYearSchema.optional(),
  q: z.string().trim().max(100).optional(),
  gender: z.enum(GENDERS).optional(),
  status: z.enum(STUDENT_STATUSES).optional(),
  centerId: z.coerce.number().int().positive().optional(),
});

export const studentSummaryQuerySchema = z.object({
  schoolYear: schoolYearSchema.optional(),
  centerId: z.coerce.number().int().positive().optional(),
});

export const enrollmentFormQuerySchema = z.object({
  schoolYear: schoolYearSchema.optional(),
  dateStarted: calendarDateSchema.optional(),
  centerId: z.coerce.number().int().positive().optional(),
});

export type StudentDto = {
  id: number;
  centerId: number;
  schoolYear: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  // "Last, First M." as on the official form.
  displayName: string;
  gender: Gender;
  birthdate: string;
  age: number;
  // A-04: ages outside 2 to 4 are accepted with a warning.
  ageWarning: boolean;
  weightKg: string;
  heightCm: string;
  parentGuardianName: string;
  enrolledOn: string;
  status: StudentStatus;
  birthOrder: number | null;
  numberOfSiblings: number | null;
  religion: string | null;
  ethnicity: string | null;
  // The extra fields of the Figma form (D9); null when there are none.
  profileExtra: ProfileExtra | null;
  // False for rows of an earlier school year.
  isEditable: boolean;
};

export type StudentSummaryRow = {
  bucket: "2" | "3" | "4" | "Other";
  male: number;
  female: number;
};
export type StudentSummary = {
  schoolYear: string;
  rows: StudentSummaryRow[];
  totalMale: number;
  totalFemale: number;
  total: number;
};

const note = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(5000, `The ${label} must be at most 5000 characters.`);

const optionalNote = z.preprocess(
  blankToUndefined,
  z.string().trim().max(5000, "Must be at most 5000 characters.").optional(),
);

export const conferenceSchema = z.object({
  noteDate: calendarDateSchema,
  noteTime: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter the time like 14:30.")
      .optional(),
  ),
  notes: note("notes"),
});
export type ConferenceInput = z.input<typeof conferenceSchema>;
export const conferencePatchSchema = conferenceSchema.partial();

export const homeVisitSchema = z.object({
  visitDate: calendarDateSchema,
  observation: note("observation"),
  parentInfo: optionalNote,
  remarks: optionalNote,
});
export type HomeVisitInput = z.input<typeof homeVisitSchema>;
export const homeVisitPatchSchema = homeVisitSchema.partial();

export const progressSchema = z.object({
  noteDate: calendarDateSchema,
  progressNotes: note("progress notes"),
});
export const progressPatchSchema = progressSchema.partial();

export type ConferenceDto = {
  id: number;
  studentId: number;
  noteDate: string;
  noteTime: string | null;
  notes: string;
};
export type HomeVisitDto = {
  id: number;
  studentId: number;
  visitDate: string;
  observation: string;
  parentInfo: string | null;
  remarks: string | null;
};
// A row of the Child's Record list (Plan 3 D10): live entries only.
export type ChildRecordRowDto = StudentDto & {
  records: { conferences: number; homeVisits: number; progress: number };
};

export const childRecordListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
});

export type ProgressDto = {
  id: number;
  studentId: number;
  noteDate: string;
  progressNotes: string;
};
