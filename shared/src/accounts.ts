import { z } from "zod";
import { type Role, type UserStatus } from "./enums.js";

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
});
export type TeacherCreateInput = z.input<typeof teacherCreateSchema>;

export const teacherPatchSchema = z.object({
  fullName: fullNameSchema.optional(),
  mobile: mobileSchema.optional().or(z.literal("").transform(() => undefined)),
  centerId: centerIdSchema.optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});
export type TeacherPatchInput = z.input<typeof teacherPatchSchema>;

// A user edits only their own name and mobile (D11). A blank mobile clears it,
// except for a Parent, whose mobile is required since sign-up (service rule).
export const profileUpdateSchema = z.object({
  fullName: fullNameSchema,
  mobile: mobileSchema.optional().or(z.literal("").transform(() => undefined)),
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
};

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

// A temporary password is returned once and never stored in plain text.
export type WithTemporaryPassword<T> = T & { temporaryPassword: string };

export type SignupResult = { centerName: string };

export const LOCKED_MESSAGE = "Too many attempts. Try again in 15 minutes.";
export const INVALID_LOGIN_MESSAGE = "Invalid username or password";
export const STATUS_LOGIN_MESSAGES = {
  PENDING: "Your account is waiting for approval by your RIC Teacher.",
  DECLINED: "Your request was declined. Please contact your RIC Teacher.",
  DISABLED: "Your account is disabled. Please contact your RIC Teacher.",
} as const;
