import type { HealthStatus } from "@ricportal/shared";
import { apiGet } from "../../lib/api";

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await apiGet<HealthStatus>("/api/health");
  return data;
}
