import type {
  PasswordResetResult,
  TeacherListQuery,
  CenterCreateInput,
  CenterDto,
  CenterPatchInput,
  PageMeta,
  ParentDto,
  TeacherCreateInput,
  TeacherDto,
  TeacherPatchInput,
  UserStatus,
} from "@ricportal/shared";
import { apiGet, apiRequest } from "../../lib/api";

export async function fetchCenters(params: {
  q?: string;
  page: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 20),
  });
  if (params.q !== undefined && params.q !== "") {
    search.set("q", params.q);
  }
  return apiGet<CenterDto[], PageMeta>(`/api/centers?${search.toString()}`);
}

export async function createCenter(input: CenterCreateInput) {
  return (await apiRequest<CenterDto>("POST", "/api/centers", input)).data;
}

export async function updateCenter(id: number, input: CenterPatchInput) {
  return (
    await apiRequest<CenterDto>("PATCH", `/api/centers/${String(id)}`, input)
  ).data;
}

export async function fetchTeachers(page: number, filters: TeacherListQuery) {
  const search = new URLSearchParams({ page: String(page) });
  if (filters.q !== undefined) search.set("q", filters.q);
  if (filters.status !== undefined) search.set("status", filters.status);
  if (filters.centerId !== undefined) {
    search.set("centerId", String(filters.centerId));
  }
  return apiGet<TeacherDto[], PageMeta>(`/api/teachers?${search.toString()}`);
}

export async function createTeacher(input: TeacherCreateInput) {
  return (await apiRequest<TeacherDto>("POST", "/api/teachers", input)).data;
}

export async function updateTeacher(id: number, input: TeacherPatchInput) {
  return (
    await apiRequest<TeacherDto>("PATCH", `/api/teachers/${String(id)}`, input)
  ).data;
}

export async function resetTeacherPassword(id: number) {
  return (
    await apiRequest<PasswordResetResult>(
      "POST",
      `/api/teachers/${String(id)}/reset-password`,
    )
  ).data;
}

export async function fetchParents(params: {
  status?: UserStatus | undefined;
  page: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 20),
  });
  if (params.status !== undefined) {
    search.set("status", params.status);
  }
  return apiGet<ParentDto[], PageMeta>(`/api/parents?${search.toString()}`);
}

export type ParentAction = "approve" | "decline" | "disable" | "enable";

export async function moveParent(id: number, action: ParentAction) {
  return (
    await apiRequest<ParentDto>("POST", `/api/parents/${String(id)}/${action}`)
  ).data;
}

export async function resetParentPassword(id: number) {
  return (
    await apiRequest<PasswordResetResult>(
      "POST",
      `/api/parents/${String(id)}/reset-password`,
    )
  ).data;
}
