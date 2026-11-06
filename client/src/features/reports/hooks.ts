import type { ReviewInput } from "@ricportal/shared";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchLiquidationPreview,
  fetchReport,
  fetchReports,
  fetchSnapshot,
  reviewReport,
  submitLiquidation,
} from "./api";

export function useLiquidationPreview(from: string, to: string) {
  return useQuery({
    queryKey: ["liquidation-preview", from, to],
    queryFn: () => fetchLiquidationPreview(from, to),
    enabled: from !== "" && to !== "",
    placeholderData: keepPreviousData,
  });
}

function useRefreshReports() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["reports"] }),
      client.invalidateQueries({ queryKey: ["liquidation-preview"] }),
      client.invalidateQueries({ queryKey: ["purchase-request"] }),
      client.invalidateQueries({ queryKey: ["assignments"] }),
    ]);
}

export function useSubmitLiquidation() {
  const refresh = useRefreshReports();
  return useMutation({ mutationFn: submitLiquidation, onSuccess: refresh });
}

export function useReports(page: number) {
  return useQuery({
    queryKey: ["reports", "list", page],
    queryFn: () => fetchReports(page),
    placeholderData: keepPreviousData,
  });
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ["reports", "one", id],
    queryFn: () => fetchReport(id),
  });
}

export function useReportSnapshot(id: number) {
  return useQuery({
    queryKey: ["reports", "snapshot", id],
    queryFn: () => fetchSnapshot(id),
  });
}

export function useReviewReport(id: number) {
  const refresh = useRefreshReports();
  return useMutation({
    mutationFn: (input: ReviewInput) => reviewReport(id, input),
    onSuccess: refresh,
  });
}
