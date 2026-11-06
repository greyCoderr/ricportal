import type { CalendarDay } from "@ricportal/shared";
import { apiGet } from "../../lib/api";

export async function fetchCalendar(from: string, to: string) {
  const search = new URLSearchParams({ from, to });
  return (await apiGet<CalendarDay[]>(`/api/calendar?${search.toString()}`))
    .data;
}
