import { z } from "zod";
import { type Role, type UserStatus } from "./enums.js";
import { calendarDateSchema } from "./students.js";

// Validation shared by the client forms and the server (P1-T01). The messages
// are shown under the fields.

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9._]{4,30}$/,
    "Username must be 4 to 30 characters: letters, digits, dot or underscore.",
  );

const PASSWORD_MESSAGE =
  "Password must be at least 8 characters with a letter and a number.";
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, PASSWORD_MESSAGE)
  .regex(/[0-9]/, PASSWORD_MESSAGE);

export const mobileSchema = z
  .string()
  .trim()
  .regex(/^(09\d{9}|\+639\d{9})$/, "Enter a mobile number like 09171234567.");

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the full name.")
  .max(120, "Full name must be at most 120 characters.");

const centerIdSchema = z.coerce
  .number("Choose a center.")
  .int("Choose a center.")
  .positive("Choose a center.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${String(max)} characters.`)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username.").max(100),
  password: z.string().min(1, "Enter your password.").max(200),
});
export type LoginInput = z.input<typeof loginSchema>;

const confirmMatches = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

export const parentSignupSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    mobile: mobileSchema,
    centerId: centerIdSchema,
    childName: optionalText(120),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(confirmMatches, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });
export type ParentSignupInput = z.input<typeof parentSignupSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

const centerNameSchema = z
  .string()
  .trim()
  .min(2, "Enter the center name.")
  .max(120, "Center name must be at most 120 characters.");

export const centerCreateSchema = z.object({
  name: centerNameSchema,
  barangay: optionalText(120),
  address: optionalText(255),
});
export type CenterCreateInput = z.input<typeof centerCreateSchema>;

export const centerPatchSchema = z.object({
  name: centerNameSchema.optional(),
  barangay: optionalText(120),
  address: optionalText(255),
  isActive: z.boolean().optional(),
});
export type CenterPatchInput = z.input<typeof centerPatchSchema>;

export const teacherCreateSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  mobile: mobileSchema.optional().or(z.literal("").transform(() => undefined)),
  centerId: centerIdSchema,
  // D6: blank means the default password. A change is forced either way.
  password: passwordSchema
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type TeacherCreateInput = z.input<typeof teacherCreateSchema>;

export const teacherPatchSchema = z.object({
  fullName: fullNameSchema.optional(),
  mobile: mobileSchema.optional().or(z.literal("").transform(() => undefined)),
  centerId: centerIdSchema.optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
export type TeacherPatchInput = z.input<typeof teacherPatchSchema>;

export const teacherListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  centerId: z.coerce.number().int().positive().optional(),
});
export type TeacherListQuery = z.output<typeof teacherListQuerySchema>;

// Left out keeps the stored value; a blank clears it (D9).
const clearable = <T extends z.ZodType<string>>(schema: T) =>
  schema
    .optional()
    .or(z.literal("").transform(() => null))
    .or(z.null());

const clearableText = (max: number) =>
  clearable(
    z
      .string()
      .trim()
      .max(max, `Must be at most ${String(max)} characters.`),
  ).transform((value) => (value === "" ? null : value));

export const SEX_OPTIONS = ["Female", "Male"] as const;

// A user edits only their own profile (D11, D9). A blank mobile clears it, except
// for a Parent, whose mobile is required since sign-up (service rule). The birth
// date is checked against today in the service, which knows the clock.
export const profileUpdateSchema = z.object({
  fullName: fullNameSchema,
  mobile: mobileSchema.optional().or(z.literal("").transform(() => undefined)),
  email: clearable(
    z.string().trim().max(120).email("Enter an email like name@example.com."),
  ),
  address: clearableText(255),
  position: clearableText(120),
  sex: clearable(z.enum(SEX_OPTIONS, "Choose Female or Male.")),
  birthDate: clearable(calendarDateSchema),
  qualification: clearableText(160),
});
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;

export type ProfileDto = {
  id: number;
  role: Role;
  username: string;
  fullName: string;
  mobile: string | null;
  centerId: number | null;
  centerName: string | null;
  status: UserStatus;
  email: string | null;
  address: string | null;
  position: string | null;
  sex: string | null;
  birthDate: string | null;
  qualification: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  // Whole Manila calendar days since the change; null if it never changed.
  passwordChangedDaysAgo: number | null;
};

// System Activity on the Profile page, scoped to the caller (Plan 3 D7).
export type ProfileActivityDto =
  | {
      role: "ADMIN";
      teachersManaged: number;
      enrolledStudents: number;
      reportsGenerated: number;
      loginsThisMonth: number;
    }
  | {
      role: "TEACHER";
      childrenEnrolled: number;
      parentsApproved: number;
      reportsSubmitted: number;
      loginsThisMonth: number;
    }
  | { role: "PARENT"; loginsThisMonth: number };

export type LoginEventDto = { at: string };

export type SessionUser = {
  id: number;
  role: Role;
  username: string;
  fullName: string;
  centerId: number | null;
  centerName: string | null;
  mustChangePassword: boolean;
};

export type PublicCenter = { id: number; name: string };

export type CenterDto = {
  id: number;
  name: string;
  barangay: string | null;
  address: string | null;
  isActive: boolean;
};

export type TeacherDto = {
  id: number;
  username: string;
  fullName: string;
  mobile: string | null;
  status: UserStatus;
  centerId: number | null;
  centerName: string | null;
  lastLoginAt: string | null;
  // The account's created date: "Date Approved" on RIC Teachers (Plan 3 D6).
  createdAt: string;
};

// The View Profile screen (D8): the list row plus what the Teacher fills in.
export type TeacherDetailDto = TeacherDto & {
  email: string | null;
  address: string | null;
  position: string | null;
  sex: string | null;
  birthDate: string | null;
  qualification: string | null;
};

export type ParentDto = {
  id: number;
  username: string;
  fullName: string;
  mobile: string | null;
  status: UserStatus;
  childName: string | null;
  createdAt: string;
};

// D6: a reset answers only with this; no password ever leaves the server.
export const PASSWORD_RESET_MESSAGE = "The password was reset to the default.";
export type PasswordResetResult = { message: string };

export type DashboardSummary = {
  activeTeachers: number;
  disabledTeachers: number;
  centersWithTeacher: number;
  enrolledStudents: number;
  reports: { submitted: number; needRevision: number; approved: number };
  // Reports with status SUBMITTED, by type (D6). 0 until Objective 3.
  submittedByType: { enrollment: number; accomplishment: number };
};

export type SignupResult = { centerName: string };

export const LOCKED_MESSAGE = "Too many attempts. Try again in 15 minutes.";
export const INVALID_LOGIN_MESSAGE = "Invalid username or password";
export const STATUS_LOGIN_MESSAGES = {
  PENDING: "Your account is waiting for approval by your RIC Teacher.",
  DECLINED: "Your request was declined. Please contact your RIC Teacher.",
  DISABLED: "Your account is disabled. Please contact your RIC Teacher.",
} as const;
