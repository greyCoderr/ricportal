import type {
  itemPatchSchema,
  PurchaseItemDto,
  PurchaseRequestDto,
  TeacherPurchaseRequestDto,
} from "@ricportal/shared";
import type { z } from "zod";
import { fromDbDate } from "../../core/dates.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  StateInvalidError,
  ValidationError,
} from "../../core/errors.js";
import {
  budgetFor,
  isGreater,
  lineTotal,
  money,
  subtotal,
} from "../../core/money.js";
import { ownCenterId, scopeToCenter, type AuthUser } from "../../core/scope.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import type {
  ItemChange,
  PurchaseRequestsRepository,
} from "./purchase-requests.repository.js";

type PrRow = NonNullable<
  Awaited<ReturnType<PurchaseRequestsRepository["find"]>>
>;
type ItemRow = PrRow["items"][number];
type MenuDayRow = NonNullable<
  Awaited<ReturnType<PurchaseRequestsRepository["findMenuDay"]>>
>;

const DEFAULT_RATE = "25.00";
const CONFLICT_MESSAGE = "Updated by someone else. Your change was not saved.";
const LOCKED_MESSAGE = "This day is locked and can no longer be changed.";

function itemTotal(item: ItemRow) {
  return item.quantity === null || item.unitCost === null
    ? null
    : lineTotal(item.quantity, item.unitCost);
}

// D3: a Teacher may delete any row, a Parent only rows they created.
function canDeleteRow(item: { createdBy: number | null }, viewer: AuthUser) {
  if (viewer.role === "TEACHER") {
    return true;
  }
  return viewer.role === "PARENT" && item.createdBy === viewer.id;
}

function toItemDto(item: ItemRow, viewer: AuthUser): PurchaseItemDto {
  const total = itemTotal(item);
  return {
    id: item.id,
    itemNo: item.itemNo,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity === null ? null : item.quantity.toString(),
    unitCost: item.unitCost === null ? null : money(item.unitCost),
    total: total === null ? null : money(total),
    version: item.version,
    canDelete: canDeleteRow(item, viewer),
  };
}

function itemsSubtotal(items: ItemRow[]) {
  return subtotal(
    items
      .map(itemTotal)
      .filter((total): total is NonNullable<typeof total> => total !== null),
  );
}

export function createPurchaseRequestsService(deps: {
  repository: PurchaseRequestsRepository;
  settings: SettingsRepository;
  now: () => Date;
}) {
  const { repository, settings, now } = deps;

  async function requireMenuDay(date: string): Promise<MenuDayRow> {
    const day = await repository.findMenuDay(date);
    if (day === null) {
      throw new NotFoundError("There is no menu for this date.");
    }
    return day;
  }

  function baseDto(
    viewer: AuthUser,
    date: string,
    day: MenuDayRow,
    pr: PrRow | null,
  ): PurchaseRequestDto {
    const items = pr?.items ?? [];
    return {
      date,
      dayName: day.dayName,
      menuName: day.menuName,
      prNo: pr?.prNo ?? day.batch.prNo,
      status: pr?.status ?? "NOT_OPENED",
      items: items.map((item) => toItemDto(item, viewer)),
      subtotal: money(itemsSubtotal(items)),
    };
  }

  // Live while not locked, frozen on lock (BR-10).
  async function withBudget(
    viewer: AuthUser,
    centerId: number,
    date: string,
    day: MenuDayRow,
    pr: PrRow | null,
  ): Promise<TeacherPurchaseRequestDto> {
    const base = baseDto(viewer, date, day, pr);
    const total = itemsSubtotal(pr?.items ?? []);
    if (
      pr?.status === "LOCKED" &&
      pr.budget !== null &&
      pr.ratePerChild !== null &&
      pr.enrolledCount !== null
    ) {
      return {
        ...base,
        budget: money(pr.budget),
        enrolledCount: pr.enrolledCount,
        ratePerChild: money(pr.ratePerChild),
        isOverBudget: isGreater(total, pr.budget),
      };
    }
    const live = await liveBudget(centerId);
    return {
      ...base,
      budget: money(live.budget),
      enrolledCount: live.enrolledCount,
      ratePerChild: money(live.ratePerChild),
      isOverBudget: isGreater(total, live.budget),
    };
  }

  async function liveBudget(centerId: number) {
    const [schoolYear, rate] = await Promise.all([
      settings.currentSchoolYear(),
      settings.read("perChildDailyRate"),
    ]);
    const enrolledCount = await repository.countActiveStudents(
      centerId,
      schoolYear,
    );
    const ratePerChild = rate ?? DEFAULT_RATE;
    return {
      enrolledCount,
      ratePerChild,
      budget: budgetFor(enrolledCount, ratePerChild),
    };
  }

  async function teacherResult(user: AuthUser, date: string, pr: PrRow | null) {
    return withBudget(
      user,
      ownCenterId(user),
      date,
      await requireMenuDay(date),
      pr,
    );
  }

  return {
    async get(
      user: AuthUser,
      date: string,
      requestedCenterId: number | undefined,
    ): Promise<PurchaseRequestDto | TeacherPurchaseRequestDto> {
      if (user.role === "PARENT") {
        // BR-14: a day the Parent is not assigned to does not exist for them.
        const centerId = ownCenterId(user);
        if (!(await repository.isAssigned(centerId, date, user.id))) {
          throw new NotFoundError("This day was not found.");
        }
        const day = await requireMenuDay(date);
        // Built without the budget, so it can never reach a Parent (DEC-026).
        return baseDto(user, date, day, await repository.find(centerId, date));
      }
      const centerId = scopeToCenter(user, requestedCenterId);
      if (centerId === null) {
        throw new ValidationError("Some fields are not valid.", [
          { field: "centerId", message: "Choose a center." },
        ]);
      }
      const day = await requireMenuDay(date);
      return withBudget(
        user,
        centerId,
        date,
        day,
        await repository.find(centerId, date),
      );
    },

    async open(user: AuthUser, date: string) {
      const day = await requireMenuDay(date);
      const pr = await repository.open({
        centerId: ownCenterId(user),
        date,
        menuDayId: day.id,
        prNo: day.batch.prNo,
      });
      return withBudget(user, ownCenterId(user), date, day, pr);
    },

    async addItem(user: AuthUser, date: string, description: string) {
      const centerId = ownCenterId(user);
      // D3: a Parent adds rows only on an assigned day; any other day does not
      // exist for them (BR-14).
      if (
        user.role === "PARENT" &&
        !(await repository.isAssigned(centerId, date, user.id))
      ) {
        throw new NotFoundError("This day was not found.");
      }
      const day = await requireMenuDay(date);
      const pr = await repository.open({
        centerId,
        date,
        menuDayId: day.id,
        prNo: day.batch.prNo,
      });
      if (pr.status !== "OPEN") {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }
      // The repository checks the status again under a lock (AUD-003).
      const item = await repository.addItem(pr.id, description, user.id);
      if (item === null) {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }
      return toItemDto(item, user);
    },

    async updateItem(
      user: AuthUser,
      id: number,
      input: z.output<typeof itemPatchSchema>,
    ): Promise<PurchaseItemDto> {
      const item = await repository.findItem(id);
      if (item === null) {
        throw new NotFoundError("This row was not found.");
      }
      const { purchaseRequest: pr } = item;
      const date = fromDbDate(pr.feedingDate);
      if (pr.centerId !== user.centerId) {
        throw new NotFoundError("This row was not found.");
      }
      if (user.role === "PARENT") {
        if (!(await repository.isAssigned(pr.centerId, date, user.id))) {
          throw new NotFoundError("This row was not found.");
        }
      }
      if (pr.status !== "OPEN") {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }

      const change: ItemChange = {};
      if (input.description !== undefined)
        change.description = input.description;
      if (input.unit !== undefined) change.unit = input.unit;
      if (input.quantity !== undefined) change.quantity = input.quantity;
      if (input.unitCost !== undefined) change.unitCost = input.unitCost;
      if (
        input.unit !== undefined ||
        input.quantity !== undefined ||
        input.unitCost !== undefined
      ) {
        change.filledBy = user.id;
      }

      const updated = await repository.updateItemIfCurrent(
        id,
        input.version,
        change,
      );
      if (updated !== null) {
        return toItemDto(updated, user);
      }
      // Find out which guard stopped it.
      const latest = await repository.findItem(id);
      if (latest !== null && latest.purchaseRequest.status !== "OPEN") {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }
      throw new ConflictError(CONFLICT_MESSAGE);
    },

    async deleteItem(user: AuthUser, id: number): Promise<void> {
      const item = await repository.findItem(id);
      if (item === null || item.purchaseRequest.centerId !== user.centerId) {
        throw new NotFoundError("This row was not found.");
      }
      const { purchaseRequest: pr } = item;
      if (
        user.role === "PARENT" &&
        !(await repository.isAssigned(
          pr.centerId,
          fromDbDate(pr.feedingDate),
          user.id,
        ))
      ) {
        throw new NotFoundError("This row was not found.");
      }
      if (pr.status !== "OPEN") {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }
      if (!canDeleteRow(item, user)) {
        throw new ForbiddenError(
          "You can delete only the rows that you added.",
        );
      }
      if (!(await repository.deleteItem(id, pr.id))) {
        throw new StateInvalidError(LOCKED_MESSAGE);
      }
    },

    async lock(user: AuthUser, date: string) {
      const centerId = ownCenterId(user);
      const pr = await repository.find(centerId, date);
      if (pr === null) {
        await requireMenuDay(date);
        throw new StateInvalidError(
          "Add the ingredients before locking this day.",
        );
      }
      if (pr.status === "LOCKED") {
        return teacherResult(user, date, pr);
      }
      if (pr.status !== "OPEN") {
        throw new StateInvalidError(
          "This day is marked No feeding. Unlock it first.",
        );
      }
      const live = await liveBudget(centerId);
      return teacherResult(
        user,
        date,
        await repository.lock(pr.id, {
          enrolledCount: live.enrolledCount,
          ratePerChild: live.ratePerChild,
          budget: money(live.budget),
          lockedAt: now(),
          lockedBy: user.id,
        }),
      );
    },

    async unlock(user: AuthUser, date: string) {
      const pr = await repository.find(ownCenterId(user), date);
      if (pr === null) {
        await requireMenuDay(date);
        throw new StateInvalidError("This day has not been opened yet.");
      }
      if (pr.status === "OPEN") {
        return teacherResult(user, date, pr);
      }
      // BR-12, BR-16: part of a submitted liquidation.
      if (pr.submittedReportId !== null) {
        throw new StateInvalidError(
          "This day is part of a submitted report and cannot be unlocked.",
        );
      }
      return teacherResult(user, date, await repository.setOpen(pr.id));
    },

    async noFeeding(user: AuthUser, date: string) {
      const day = await requireMenuDay(date);
      const pr = await repository.open({
        centerId: ownCenterId(user),
        date,
        menuDayId: day.id,
        prNo: day.batch.prNo,
      });
      if (pr.status === "NO_FEEDING") {
        return teacherResult(user, date, pr);
      }
      if (pr.status !== "OPEN") {
        throw new StateInvalidError(
          "This day is locked. Unlock it before marking No feeding.",
        );
      }
      return teacherResult(user, date, await repository.setNoFeeding(pr.id));
    },
  };
}

export type PurchaseRequestsService = ReturnType<
  typeof createPurchaseRequestsService
>;
