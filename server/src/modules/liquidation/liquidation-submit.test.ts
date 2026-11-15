import { describe, expect, it } from "vitest";
import { ConflictError } from "../../core/errors.js";
import type { AuthUser } from "../../core/scope.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import {
  SubmitRaceError,
  type LiquidationRepository,
} from "./liquidation.repository.js";
import { createLiquidationService } from "./liquidation.service.js";

// AUD-008 (docs/AUDIT_REPORT.md): only the known race is answered as a 409.
// Any other failure of the submit transaction reaches the error handler.

const TEACHER: AuthUser = {
  id: 7,
  role: "TEACHER",
  centerId: 3,
  mustChangePassword: false,
};

function serviceWhereSubmitFailsWith(failure: Error) {
  const day = new Date("2026-11-09T00:00:00.000Z");
  const repository = {
    findCenter: () => Promise.resolve({ name: "Center A", barangay: null }),
    findActiveTeacherName: () => Promise.resolve("Teacher A"),
    listMenuDays: () =>
      Promise.resolve([
        {
          feedingDate: day,
          dayName: "Monday",
          menuName: "PORK PICADILLO",
          batch: { prNo: "SF-2026-009", prDate: day },
        },
      ]),
    listPrs: () =>
      Promise.resolve([
        {
          id: 11,
          feedingDate: day,
          prNo: "SF-2026-009",
          status: "LOCKED",
          items: [],
        },
      ]),
    findOverlapping: () => Promise.resolve([]),
    submit: () => Promise.reject(failure),
  } as unknown as LiquidationRepository;
  const settings = {
    read: () => Promise.resolve(null),
    currentSchoolYear: () => Promise.resolve("2026-2027"),
  } as unknown as SettingsRepository;
  return createLiquidationService({
    repository,
    settings,
    now: () => new Date("2026-11-12T02:00:00Z"),
  });
}

describe("liquidation submit: which failures become a 409 (AUD-008)", () => {
  it("the known race (a day taken by another request) is a 409", async () => {
    const service = serviceWhereSubmitFailsWith(new SubmitRaceError());
    await expect(
      service.submit(TEACHER, "2026-11-09", "2026-11-09"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("any other failure is passed on unchanged, not turned into a 409", async () => {
    const failure = new Error("the database went away");
    const service = serviceWhereSubmitFailsWith(failure);
    await expect(
      service.submit(TEACHER, "2026-11-09", "2026-11-09"),
    ).rejects.toBe(failure);
  });
});
