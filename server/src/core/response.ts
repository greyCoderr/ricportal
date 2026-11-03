import type { ApiSuccess, PageMeta } from "@ricportal/shared";
import type { Response } from "express";

export function ok<T, M extends object = Record<string, never>>(
  res: Response,
  data: T,
  meta?: M,
): void {
  const body: ApiSuccess<T, M | Record<string, never>> = {
    data,
    meta: meta ?? {},
  };
  res.status(200).json(body);
}

export function created<T>(res: Response, data: T): void {
  const body: ApiSuccess<T> = { data, meta: {} };
  res.status(201).json(body);
}

export function paginated<T>(res: Response, items: T[], meta: PageMeta): void {
  const body: ApiSuccess<T[], PageMeta> = {
    data: items,
    meta: { page: meta.page, pageSize: meta.pageSize, total: meta.total },
  };
  res.status(200).json(body);
}
