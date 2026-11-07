import type {
  FeedbackDto,
  ReportStatus,
  LiquidationData,
  PageMeta,
  ReportDetailDto,
  ReportDto,
  ReportSnapshotDto,
  ReviewInput,
} from "@ricportal/shared";
import { apiGet, apiRequest } from "../../lib/api";

export async function fetchLiquidationPreview(from: string, to: string) {
  const search = new URLSearchParams({ from, to });
  return (
    await apiGet<LiquidationData>(
      `/api/liquidation/preview?${search.toString()}`,
    )
  ).data;
}

export async function submitLiquidation(input: { from: string; to: string }) {
  return (
    await apiRequest<ReportDetailDto>("POST", "/api/liquidation/submit", input)
  ).data;
}

export function liveFormUrl(
  kind: "summary" | "transmittal",
  from: string,
  to: string,
): string {
  const search = new URLSearchParams({ from, to });
  return `/api/liquidation/pdf/${kind}?${search.toString()}`;
}

export function livePurchaseRequestUrl(date: string): string {
  return `/api/liquidation/pdf/purchase-request?date=${date}`;
}

export function reportFormUrl(
  id: number,
  kind: "summary" | "transmittal",
): string {
  return `/api/reports/${String(id)}/pdf/${kind}`;
}

export function reportPurchaseRequestUrl(id: number, date: string): string {
  return `/api/reports/${String(id)}/pdf/purchase-request?date=${date}`;
}

export function fetchReports(page: number, status?: ReportStatus) {
  const search = new URLSearchParams({ page: String(page) });
  if (status !== undefined) search.set("status", status);
  return apiGet<ReportDto[], PageMeta>(`/api/reports?${search.toString()}`);
}

export function fetchFeedback(page: number) {
  return apiGet<FeedbackDto[], PageMeta>(
    `/api/reports/feedback?page=${String(page)}`,
  );
}

export async function fetchReport(id: number) {
  return (await apiGet<ReportDetailDto>(`/api/reports/${String(id)}`)).data;
}

export async function fetchSnapshot(id: number) {
  return (
    await apiGet<ReportSnapshotDto>(`/api/reports/${String(id)}/snapshot`)
  ).data;
}

export async function reviewReport(id: number, input: ReviewInput) {
  return (
    await apiRequest<ReportDetailDto>(
      "POST",
      `/api/reports/${String(id)}/review`,
      input,
    )
  ).data;
}
