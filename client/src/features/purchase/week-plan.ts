import {
  WEEK_TEAM_MAX,
  type AssignmentDay,
  type AssignmentWeek,
  type WeekSaveInput,
} from "@ricportal/shared";

// The working copy behind the Assign Parents modal (D4). Pure, so the rules the
// screen shows are tested without a browser. The server checks them again.

// Four team slots; null is an empty dropdown.
export type TeamSlots = (number | null)[];
// Parent ids per feeding date.
export type DayPicks = Record<string, number[]>;

export function feedingDays(days: AssignmentDay[]): AssignmentDay[] {
  return days.filter((day) => day.menuName !== null);
}

export function initialSlots(week: AssignmentWeek): TeamSlots {
  return Array.from(
    { length: WEEK_TEAM_MAX },
    (_, index) => week.team[index]?.id ?? null,
  );
}

export function initialPicks(week: AssignmentWeek): DayPicks {
  return Object.fromEntries(
    feedingDays(week.days).map((day) => [
      day.date,
      day.parents.map((parent) => parent.id),
    ]),
  );
}

export function teamIds(slots: TeamSlots): number[] {
  return [...new Set(slots.filter((id): id is number => id !== null))];
}

export function togglePick(
  picks: DayPicks,
  date: string,
  parentId: number,
  on: boolean,
): DayPicks {
  const current = picks[date] ?? [];
  const next = on
    ? [...new Set([...current, parentId])]
    : current.filter((id) => id !== parentId);
  return { ...picks, [date]: next };
}

// Copies the first feeding day's parents to every feeding day.
export function applyFirstDayToAll(picks: DayPicks, dates: string[]): DayPicks {
  const first = dates[0];
  const chosen = first === undefined ? [] : (picks[first] ?? []);
  return Object.fromEntries(dates.map((date) => [date, [...chosen]]));
}

// A parent removed from the team in Step 1 no longer counts on any day.
export function picksForDay(
  picks: DayPicks,
  date: string,
  team: number[],
): number[] {
  return (picks[date] ?? []).filter((id) => team.includes(id));
}

export function daysWithoutParent(
  picks: DayPicks,
  dates: string[],
  team: number[],
): string[] {
  return dates.filter((date) => picksForDay(picks, date, team).length === 0);
}

export function buildWeekSave(
  monday: string,
  slots: TeamSlots,
  picks: DayPicks,
  dates: string[],
): WeekSaveInput {
  const team = teamIds(slots);
  return {
    week: monday,
    teamParentIds: team,
    days: dates.map((date) => ({
      date,
      parentIds: picksForDay(picks, date, team),
    })),
  };
}
