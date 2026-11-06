import type { MenuBatchDto, MenuPreview, PageMeta } from "@ricportal/shared";
import { apiGet, apiRequest } from "../../lib/api";

export async function previewMenu(file: File): Promise<MenuPreview> {
  const form = new FormData();
  form.append("file", file);
  return (
    await apiRequest<MenuPreview>("POST", "/api/menu/imports/preview", form)
  ).data;
}

export async function confirmMenu(token: string) {
  return (
    await apiRequest<{ batches: number; days: number }>(
      "POST",
      "/api/menu/imports/confirm",
      { token },
    )
  ).data;
}

export function fetchBatches(page: number) {
  return apiGet<MenuBatchDto[], PageMeta>(
    `/api/menu/batches?page=${String(page)}`,
  );
}
