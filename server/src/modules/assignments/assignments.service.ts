import {
  addDays,
  weekdayName,
  type AssignmentDay,
  type ParentScheduleDay,
  type PrDayStatus,
} from "@ricportal/shared";
import { fromDbDate } from "../../core/dates.js";
import { RuleViolationError } from "../../core/errors.js";
import { ownCenterId, type AuthUser } from "../../core/scope.js";
import type { AssignmentsRepository } from "./assignments.repository.js";

export function createAssignmentsService(repository: AssignmentsRepository) {
  return {
    // Seven days, Monday to Sunday (BR-13).
    async week(user: AuthUser, monday: string): Promise<AssignmentDay[]> {
      const centerId = ownCenterId(user);
      const sunday = addDays(monday, 6);
      const [menus, assignments, statuses] = await Promise.all([
        repository.listMenuDays(monday, sunday),
        repository.listAssignments(centerId, monday, sunday),
        repository.listPrStatuses(centerId, monday, sunday),
      ]);
      const menuByDate = new Map(
        menus.map((row) => [fromDbDate(row.feedingDate), row]),
      );
      const statusByDate = new Map<string, PrDayStatus>(
        statuses.map((row) => [fromDbDate(row.feedingDate), row.status]),
      );
      return Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index);
        const menu = menuByDate.get(date);
        return {
          date,
          dayName: weekdayName(date),
          menuName: menu?.menuName ?? null,
          status: statusByDate.get(date) ?? "NOT_OPENED",
          parents: assignments
            .filter((row) => fromDbDate(row.feedingDate) === date)
            .map((row) => row.parent),
        };
      });
    },

    // BR-13: only feeding days, only approved Parents of the same center.
    async replace(user: AuthUser, date: string, parentIds: number[]) {
      const centerId = ownCenterId(user);
      if (!(await repository.menuDayExists(date))) {
        throw new RuleViolationError(
          "This date has no menu, so Parents cannot be assigned to it.",
        );
      }
      const unique = [...new Set(parentIds)];
      const approved = await repository.countApprovedParents(centerId, unique);
      if (approved !== unique.length) {
        throw new RuleViolationError(
          "Only approved Parents of this center can be assigned.",
        );
      }
      await repository.replaceAssignments({
        centerId,
        date,
        parentIds: unique,
        assignedBy: user.id,
      });
      return { date, parentIds: unique };
    },

    // BR-14: a Parent sees only assigned days.
    async schedule(
      user: AuthUser,
      from: string,
      to: string,
    ): Promise<ParentScheduleDay[]> {
      const centerId = ownCenterId(user);
      const [assigned, menus, statuses] = await Promise.all([
        repository.listForParent({ centerId, parentId: user.id, from, to }),
        repository.listMenuDays(from, to),
        repository.listPrStatuses(centerId, from, to),
      ]);
      const menuByDate = new Map(
        menus.map((row) => [fromDbDate(row.feedingDate), row]),
      );
      const statusByDate = new Map<string, PrDayStatus>(
        statuses.map((row) => [fromDbDate(row.feedingDate), row.status]),
      );
      return assigned.flatMap((row) => {
        const date = fromDbDate(row.feedingDate);
        const menu = menuByDate.get(date);
        return menu === undefined
          ? []
          : [
              {
                date,
                dayName: weekdayName(date),
                menuName: menu.menuName,
                status: statusByDate.get(date) ?? "NOT_OPENED",
              },
            ];
      });
    },
  };
}

export type AssignmentsService = ReturnType<typeof createAssignmentsService>;
