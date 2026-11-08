import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchChildRecords } from "./api";

export function useChildRecords(params: { q: string; page: number }) {
  return useQuery({
    queryKey: ["child-records", params],
    queryFn: () => fetchChildRecords(params),
    placeholderData: keepPreviousData,
  });
}
