import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError } from "./errors.js";
import {
  assertCenterAccess,
  ownCenterId,
  scopeToCenter,
  type AuthUser,
} from "./scope.js";

const admin: AuthUser = {
  id: 1,
  role: "ADMIN",
  centerId: null,
  mustChangePassword: false,
};
const teacher: AuthUser = {
  id: 2,
  role: "TEACHER",
  centerId: 5,
  mustChangePassword: false,
};

describe("scopeToCenter", () => {
  it("Admin reads any center, or all with none asked", () => {
    expect(scopeToCenter(admin)).toBe(null);
    expect(scopeToCenter(admin, 9)).toBe(9);
  });

  it("a Teacher gets the own center, and 404 for another", () => {
    expect(scopeToCenter(teacher)).toBe(5);
    expect(scopeToCenter(teacher, 5)).toBe(5);
    expect(() => scopeToCenter(teacher, 9)).toThrow(NotFoundError);
  });
});

describe("ownCenterId and assertCenterAccess", () => {
  it("ownCenterId refuses a user with no center", () => {
    expect(ownCenterId(teacher)).toBe(5);
    expect(() => ownCenterId(admin)).toThrow(ForbiddenError);
  });

  it("assertCenterAccess hides other centers", () => {
    expect(() => {
      assertCenterAccess(teacher, 5);
      assertCenterAccess(admin, 9);
    }).not.toThrow();
    expect(() => {
      assertCenterAccess(teacher, 9);
    }).toThrow(NotFoundError);
  });
});
