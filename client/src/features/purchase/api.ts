import type {
  ApprovedParent,
  AssignmentWeek,
  ItemPatchInput,
  ParentScheduleDay,
  PurchaseItemDto,
  PurchaseRequestDto,
  TeacherPurchaseRequestDto,
  WeekSaveInput,
} from "@ricportal/shared";
import { apiGet, apiRequest } from "../../lib/api";

export type AnyPurchaseRequest = PurchaseRequestDto &
  Partial<
    Pick<
      TeacherPurchaseRequestDto,
      "budget" | "enrolledCount" | "ratePerChild" | "isOverBudget"
    >
  >;

const prPath = (date: string) => `/api/purchase-requests/${date}`;

export async function fetchPurchaseRequest(date: string, centerId?: number) {
  const query = centerId === undefined ? "" : `?centerId=${String(centerId)}`;
  return (await apiGet<AnyPurchaseRequest>(`${prPath(date)}${query}`)).data;
}

export type PrAction = "open" | "lock" | "unlock" | "no-feeding";

export async function runPrAction(date: string, action: PrAction) {
  return (
    await apiRequest<AnyPurchaseRequest>("POST", `${prPath(date)}/${action}`)
  ).data;
}

export async function addItem(date: string, description: string) {
  return (
    await apiRequest<PurchaseItemDto>("POST", `${prPath(date)}/items`, {
      description,
    })
  ).data;
}

export async function patchItem(id: number, patch: ItemPatchInput) {
  return (
    await apiRequest<PurchaseItemDto>(
      "PATCH",
      `/api/purchase-items/${String(id)}`,
      patch,
    )
  ).data;
}

export async function deleteItem(id: number) {
  await apiRequest("DELETE", `/api/purchase-items/${String(id)}`);
}

export async function fetchAssignmentWeek(monday: string) {
  return (await apiGet<AssignmentWeek>(`/api/assignments/week?week=${monday}`))
    .data;
}

export async function saveWeek(input: WeekSaveInput) {
  return (
    await apiRequest<AssignmentWeek>("PUT", "/api/assignments/week", input)
  ).data;
}

export async function fetchApprovedParents() {
  return (await apiGet<ApprovedParent[]>("/api/parents/approved")).data;
}

export async function fetchSchedule(from: string, to: string) {
  const search = new URLSearchParams({ from, to });
  return (
    await apiGet<ParentScheduleDay[]>(
      `/api/parent-schedule?${search.toString()}`,
    )
  ).data;
}
