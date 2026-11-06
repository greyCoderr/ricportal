export const ROLES = ["ADMIN", "TEACHER", "PARENT"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = [
  "ACTIVE",
  "PENDING",
  "DECLINED",
  "DISABLED",
] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
