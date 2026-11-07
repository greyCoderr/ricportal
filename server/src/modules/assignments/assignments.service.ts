import {
  addDays,
  mondayOf,
  weekdayName,
  WEEK_TEAM_MAX,
  type ApprovedParent,
  type AssignmentDay,
  type AssignmentWeek,
  type ParentScheduleDay,
  type PrDayStatus,
  type weekSaveSchema,
} from "@ricportal/shared";
import type { z } from "zod";
import { fromDbDate } from "../../core/dates.js";
import { RuleViolationError } from "../../core/errors.js";
import { ownCenterId, type AuthUser } from "../../core/scope.js";
import type { AssignmentsRepository } from "./assignments.repository.js";

export function createAssignmentsService(repository: AssignmentsRepository) {
  // Seven days, Monday to Sunday (BR-13).
  async function weekDays(
    centerId: number,
    monday: string,
  ): Promise<AssignmentDay[]> {
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
          .map((row) => ({
            id: row.parent.id,
            fullName: row.parent.fullName,
          })),
      };
    });
  }

  async function requireApproved(centerId: number, ids: number[]) {
    const approved = await repository.countApprovedParents(centerId, ids);
    if (approved !== ids.length) {
      throw new RuleViolationError(
        "Only approved Parents of this center can be assigned.",
      );
    }
  }

  // A day saved before the team table existed still counts towards the team.
  async function weekTeam(
    centerId: number,
    monday: string,
  ): Promise<ApprovedParent[]> {
    const [team, assigned] = await Promise.all([
      repository.listTeam(centerId, monday),
      repository.listAssignments(centerId, monday, addDays(monday, 6)),
    ]);
    const byId = new Map<number, ApprovedParent>();
    for (const { parent } of [...team, ...assigned]) {
      byId.set(parent.id, {
        id: parent.id,
        fullName: parent.fullName,
        username: parent.username,
      });
    }
    return [...byId.values()].sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  }

  return {
    week(user: AuthUser, monday: string): Promise<AssignmentDay[]> {
      return weekDays(ownCenterId(user), monday);
    },

    async readWeek(user: AuthUser, monday: string): Promise<AssignmentWeek> {
      const centerId = ownCenterId(user);
      const [team, days] = await Promise.all([
        weekTeam(centerId, monday),
        weekDays(centerId, monday),
      ]);
      return { week: monday, team, days };
    },

    // D4: a team of at most 4 approved Parents of the center, and each feeding
    // day gets Parents from that team. Saved as a whole, or not at all.
    async saveWeek(
      user: AuthUser,
      input: z.output<typeof weekSaveSchema>,
    ): Promise<AssignmentWeek> {
      const centerId = ownCenterId(user);
      const { week: monday, teamParentIds, days } = input;
      const sunday = addDays(monday, 6);

      const team = new Set(teamParentIds);
      if (team.size !== teamParentIds.length) {
        throw new RuleViolationError("A Parent can be in the team only once.");
      }
      if (team.size > WEEK_TEAM_MAX) {
        throw new RuleViolationError(
          `A week's team can have at most ${String(WEEK_TEAM_MAX)} Parents.`,
        );
      }
      await requireApproved(centerId, teamParentIds);

      const menus = await repository.listMenuDays(monday, sunday);
      const feedingDates = new Set(
        menus.map((row) => fromDbDate(row.feedingDate)),
      );
      const seen = new Set<string>();
      const cleaned = days.map((day) => {
        if (day.date < monday || day.date > sunday) {
          throw new RuleViolationError(
            "Every day must be inside the week, Monday to Sunday.",
          );
        }
        if (seen.has(day.date)) {
          throw new RuleViolationError("A day can be listed only once.");
        }
        seen.add(day.date);
        if (!feedingDates.has(day.date)) {
          throw new RuleViolationError(
            "This date has no menu, so Parents cannot be assigned to it.",
          );
        }
        const parentIds = [...new Set(day.parentIds)];
        if (parentIds.some((id) => !team.has(id))) {
          throw new RuleViolationError(
            "Parents of a day must belong to the week's team.",
          );
        }
        return { date: day.date, parentIds };
      });

      await repository.saveWeek({
        centerId,
        monday,
        sunday,
        teamParentIds,
        days: cleaned,
        assignedBy: user.id,
      });
      const [savedTeam, savedDays] = await Promise.all([
        weekTeam(centerId, monday),
        weekDays(centerId, monday),
      ]);
      return { week: monday, team: savedTeam, days: savedDays };
    },

    // BR-13: only feeding days, only approved Parents of the same center. Saving
    // one day cannot take the week past its team limit (D4).
    async replace(user: AuthUser, date: string, parentIds: number[]) {
      const centerId = ownCenterId(user);
      if (!(await repository.menuDayExists(date))) {
        throw new RuleViolationError(
          "This date has no menu, so Parents cannot be assigned to it.",
        );
      }
      const unique = [...new Set(parentIds)];
      await requireApproved(centerId, unique);
      const monday = mondayOf(date);
      const team = await weekTeam(centerId, monday);
      const after = new Set([...team.map((row) => row.id), ...unique]);
      if (after.size > WEEK_TEAM_MAX) {
        throw new RuleViolationError(
          `A week's team can have at most ${String(WEEK_TEAM_MAX)} Parents.`,
        );
      }
      await repository.replaceAssignments({
        centerId,
        date,
        monday,
        parentIds: unique,
        assignedBy: user.id,
      });
      return { date, parentIds: unique };
    },

    // D2: every menu of the range for the Parent's own center, with the names of
    // the Parents assigned. The status is only for the Parent's own days.
    async schedule(
      user: AuthUser,
      from: string,
      to: string,
    ): Promise<ParentScheduleDay[]> {
      const centerId = ownCenterId(user);
      const [menus, assignments, statuses] = await Promise.all([
        repository.listMenuDays(from, to),
        repository.listAssignments(centerId, from, to),
        repository.listPrStatuses(centerId, from, to),
      ]);
      const statusByDate = new Map<string, PrDayStatus>(
        statuses.map((row) => [fromDbDate(row.feedingDate), row.status]),
      );
      return menus
        .map((menu) => {
          const date = fromDbDate(menu.feedingDate);
          const parents = assignments
            .filter((row) => fromDbDate(row.feedingDate) === date)
            .map((row) => ({
              id: row.parent.id,
              fullName: row.parent.fullName,
            }));
          const assigned = parents.some((parent) => parent.id === user.id);
          return {
            date,
            dayName: weekdayName(date),
            menuName: menu.menuName,
            assigned,
            status: assigned ? (statusByDate.get(date) ?? "NOT_OPENED") : null,
            parents,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}

export type AssignmentsService = ReturnType<typeof createAssignmentsService>;
