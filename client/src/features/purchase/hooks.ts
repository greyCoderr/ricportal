import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DayRange } from "../calendar/hooks";
import {
  addItem,
  deleteItem,
  fetchApprovedParents,
  fetchAssignmentWeek,
  fetchPurchaseRequest,
  fetchSchedule,
  patchItem,
  runPrAction,
  saveWeek,
  type PrAction,
} from "./api";

export function usePurchaseRequest(date: string, centerId?: number) {
  return useQuery({
    queryKey: ["purchase-request", date, centerId],
    queryFn: () => fetchPurchaseRequest(date, centerId),
  });
}

function useRefreshDay(date: string) {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["purchase-request", date] }),
      client.invalidateQueries({ queryKey: ["assignments"] }),
      client.invalidateQueries({ queryKey: ["parent-schedule"] }),
    ]);
}

export function useRefreshPurchaseRequest(date: string) {
  return useRefreshDay(date);
}

export function usePrAction(date: string) {
  const refresh = useRefreshDay(date);
  return useMutation({
    mutationFn: (action: PrAction) => runPrAction(date, action),
    onSuccess: refresh,
  });
}

export function useAddItem(date: string) {
  const refresh = useRefreshDay(date);
  return useMutation({
    mutationFn: (description: string) => addItem(date, description),
    onSuccess: refresh,
  });
}

export function useDeleteItem(date: string) {
  const refresh = useRefreshDay(date);
  return useMutation({ mutationFn: deleteItem, onSuccess: refresh });
}

export { patchItem };

export function useAssignmentWeek(monday: string) {
  return useQuery({
    queryKey: ["assignments", monday],
    queryFn: () => fetchAssignmentWeek(monday),
  });
}

export function useApprovedParents() {
  return useQuery({
    queryKey: ["parents", "approved"],
    queryFn: fetchApprovedParents,
  });
}

export function useSaveWeek() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveWeek,
    onSuccess: () => client.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useSchedule(range: DayRange | null) {
  return useQuery({
    queryKey: ["parent-schedule", range],
    queryFn: () => fetchSchedule(range?.from ?? "", range?.to ?? ""),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });
}
