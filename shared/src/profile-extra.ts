import { z } from "zod";
import { isCalendarDate } from "./dates.js";

// The fields of the Figma "add enroll" form (258:5447) that have no column of
// their own (D9). Stored as JSON text in students.profile_extra and validated
// here at the edge. Everything is optional until the client confirms the fields
// (A-17, docs/ui-specs/student-form.md). Field limits match what the form shows.

const TEXT_MAX = 120;
const SHORT_MAX = 20;
export const PROFILE_EXTRA_MAX_CHARS = 6000;
export const FAMILY_MEMBERS_MAX = 5;
export const DISABILITIES_MAX = 3;
export const ECCD_MAX = 2;

const text = z
  .string("Enter text.")
  .trim()
  .max(TEXT_MAX, `Must be at most ${String(TEXT_MAX)} characters.`);
const shortText = z
  .string("Enter text.")
  .trim()
  .max(SHORT_MAX, `Must be at most ${String(SHORT_MAX)} characters.`);

const dateOrBlank = z
  .string("Enter a valid date.")
  .refine(
    (value) => value === "" || isCalendarDate(value),
    "Enter a valid date.",
  );

const amountOrBlank = z
  .string("Enter an amount.")
  .regex(/^(\d{1,9}(\.\d{1,2})?)?$/, "Enter an amount like 150.00.");

const familyMemberSchema = z
  .strictObject({
    fullName: text,
    birthday: dateOrBlank,
    relationship: text,
    sex: z.enum(["", "M", "F"], "Choose M or F."),
    civilStatus: text,
    education: text,
    occupation: text,
    monthlyIncome: amountOrBlank,
  })
  .partial();

const disabilitySchema = z.strictObject({ type: text, cause: text }).partial();

const eccdSchema = z
  .strictObject({
    serviceType: text,
    service: text,
    from: dateOrBlank,
    to: dateOrBlank,
  })
  .partial();

const check = z.boolean("Choose yes or no.");

export const profileExtraSchema = z
  .strictObject({
    // I. Identifying Information
    facilityLocation: text,
    facilityBarangay: text,
    facilityMunicipality: text,
    facilityProvince: text,
    facilityRegion: text,
    nickname: text,
    suffix: text,
    birthPlace: text,
    birthRegistered: z.enum(["", "YES", "NO"], "Choose Yes or No."),
    homeStreet: text,
    homeBarangay: text,
    homeMunicipality: text,
    homeProvince: text,
    homeRegion: text,
    // II. Family Information
    familyMembers: z.array(familyMemberSchema).max(FAMILY_MEMBERS_MAX),
    breastfed: check,
    breastfedMonths: shortText,
    supplemental: check,
    supplementalDays: shortText,
    riceDistribution: check,
    riceKg: shortText,
    assistance: check,
    assistanceGovernment: check,
    assistancePrivate: check,
    assistanceOthers: check,
    assistanceOthersText: text,
    disabilities: z.array(disabilitySchema).max(DISABILITIES_MAX),
    eccd: z.array(eccdSchema).max(ECCD_MAX),
    // 15 to 17 and the sign-off
    feePaid: check,
    feeAmount: amountOrBlank,
    counterpartCash: check,
    counterpartInKind: check,
    counterpartNone: check,
    scheduleCash: check,
    scheduleInKind: check,
    attendanceContinuing: check,
    attendanceDroppedOut: check,
    dropIllness: check,
    dropTransfer: check,
    dropOthers: check,
    dropOthersText: text,
    accomplishedBy: text,
    dateAccomplished: dateOrBlank,
    providerName: text,
    encoderId: text,
  })
  .partial()
  .refine((value) => JSON.stringify(value).length <= PROFILE_EXTRA_MAX_CHARS, {
    message: "This form is too large to save.",
  });

export type ProfileExtra = z.output<typeof profileExtraSchema>;
