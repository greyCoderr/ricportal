import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCalendar } from "./api";

export type DayRange = { from: string; to: string };

export function useCalendar(range: DayRange | null) {
  return useQuery({
    queryKey: ["calendar", range],
    queryFn: () => fetchCalendar(range?.from ?? "", range?.to ?? ""),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });
}
