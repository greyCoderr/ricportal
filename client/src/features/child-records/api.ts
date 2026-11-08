import type { ChildRecordRowDto, PageMeta } from "@ricportal/shared";
import { apiGet } from "../../lib/api";

export function fetchChildRecords(params: { q: string; page: number }) {
  const search = new URLSearchParams({ page: String(params.page) });
  if (params.q !== "") search.set("q", params.q);
  return apiGet<ChildRecordRowDto[], PageMeta>(
    `/api/child-records?${search.toString()}`,
  );
}
