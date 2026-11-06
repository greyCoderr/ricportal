import type { Role } from "@ricportal/shared";
import { ForbiddenError, NotFoundError } from "./errors.js";

export type AuthUser = {
  id: number;
  role: Role;
  centerId: number | null;
  mustChangePassword: boolean;
};

// BR-02: Teachers and Parents only ever see their own center. A row of another
// center answers 404, so its existence is not revealed.
export function ownCenterId(user: AuthUser): number {
  if (user.centerId === null) {
    throw new ForbiddenError();
  }
  return user.centerId;
}

// Returns the center a request may read: Admin any (the requested one, or null
// for all), everyone else only their own. Asking for another center is a 404.
export function scopeToCenter(
  user: AuthUser,
  requested?: number,
): number | null {
  if (user.role === "ADMIN") {
    return requested ?? null;
  }
  const own = ownCenterId(user);
  if (requested !== undefined && requested !== own) {
    throw new NotFoundError();
  }
  return own;
}

// For a row already loaded: throws 404 unless the user may see that center.
export function assertCenterAccess(user: AuthUser, centerId: number): void {
  if (user.role !== "ADMIN" && user.centerId !== centerId) {
    throw new NotFoundError();
  }
}
