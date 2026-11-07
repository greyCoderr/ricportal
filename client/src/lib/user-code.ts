import type { Role } from "@ricportal/shared";

// Figma shows codes like "RIC-TCHR-2025-001"; the blueprint has no such field, so
// this is a display code from the row id, not stored (DEC-040).
const PREFIX: Record<Role, string> = {
  ADMIN: "RIC-ADM",
  TEACHER: "RIC-TCHR",
  PARENT: "RIC-PRNT",
};

export function userCode(role: Role, id: number): string {
  return `${PREFIX[role]}-${String(id).padStart(3, "0")}`;
}
