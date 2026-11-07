import type { DashboardSummary } from "@ricportal/shared";
import { apiGet } from "../../lib/api";

export async function fetchDashboardSummary() {
  return (await apiGet<DashboardSummary>("/api/dashboard/summary")).data;
}
