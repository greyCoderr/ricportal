import type { AssignmentDay } from "@ricportal/shared";
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
  fetchPurchaseRequest,
  fetchSchedule,
  fetchWeek,
  patchItem,
  putAssignments,
  runPrAction,
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

export function useWeek(monday: string) {
  return useQuery({
    queryKey: ["assignments", monday],
    queryFn: () => fetchWeek(monday),
    placeholderData: keepPreviousData,
  });
}

export function useApprovedParents() {
  return useQuery({
    queryKey: ["parents", "approved"],
    queryFn: fetchApprovedParents,
  });
}

// Saves at once with an optimistic update; a failure rolls back (phase 5).
export function useSetAssignments(monday: string) {
  const client = useQueryClient();
  const key = ["assignments", monday];
  return useMutation({
    mutationFn: (input: {
      date: string;
      parents: { id: number; fullName: string }[];
    }) =>
      putAssignments(
        input.date,
        input.parents.map((parent) => parent.id),
      ),
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<AssignmentDay[]>(key);
      client.setQueryData<AssignmentDay[]>(key, (days) =>
        days?.map((day) =>
          day.date === input.date ? { ...day, parents: input.parents } : day,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      client.setQueryData(key, context?.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
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
