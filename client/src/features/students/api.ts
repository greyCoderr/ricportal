import type {
  conferenceSchema,
  ConferenceDto,
  homeVisitSchema,
  HomeVisitDto,
  PageMeta,
  progressSchema,
  ProgressDto,
  studentCreateSchema,
  StudentDto,
  studentPatchSchema,
  StudentStatus,
  StudentSummary,
} from "@ricportal/shared";
import type { z } from "zod";
import { apiGet, apiRequest } from "../../lib/api";

export type StudentListParams = {
  q?: string;
  status?: StudentStatus | undefined;
  schoolYear?: string | undefined;
  page: number;
};

export function fetchStudents(params: StudentListParams) {
  const search = new URLSearchParams({ page: String(params.page) });
  if (params.q !== undefined && params.q !== "") search.set("q", params.q);
  if (params.status !== undefined) search.set("status", params.status);
  if (params.schoolYear !== undefined) {
    search.set("schoolYear", params.schoolYear);
  }
  return apiGet<StudentDto[], PageMeta>(`/api/students?${search.toString()}`);
}

export async function fetchStudent(id: number) {
  return (await apiGet<StudentDto>(`/api/students/${String(id)}`)).data;
}

export async function fetchSummary() {
  return (await apiGet<StudentSummary>("/api/students/summary")).data;
}

export async function createStudent(
  input: z.output<typeof studentCreateSchema>,
) {
  return (await apiRequest<StudentDto>("POST", "/api/students", input)).data;
}

export async function updateStudent(
  id: number,
  input: z.output<typeof studentPatchSchema>,
) {
  return (
    await apiRequest<StudentDto>("PATCH", `/api/students/${String(id)}`, input)
  ).data;
}

export async function setStudentArchived(id: number, archived: boolean) {
  const action = archived ? "archive" : "restore";
  return (
    await apiRequest<StudentDto>(
      "POST",
      `/api/students/${String(id)}/${action}`,
    )
  ).data;
}

export function enrollmentFormUrl(
  dateStarted: string,
  schoolYear?: string,
): string {
  const search = new URLSearchParams();
  if (dateStarted !== "") search.set("dateStarted", dateStarted);
  if (schoolYear !== undefined) search.set("schoolYear", schoolYear);
  const query = search.toString();
  return `/api/enrollment-form.pdf${query === "" ? "" : `?${query}`}`;
}

export async function fetchConferences(studentId: number) {
  return (
    await apiGet<ConferenceDto[]>(
      `/api/students/${String(studentId)}/conferences`,
    )
  ).data;
}

export async function saveConference(input: {
  studentId: number;
  id: number | null;
  data: z.output<typeof conferenceSchema>;
}) {
  const path =
    input.id === null
      ? `/api/students/${String(input.studentId)}/conferences`
      : `/api/conferences/${String(input.id)}`;
  return (
    await apiRequest<ConferenceDto>(
      input.id === null ? "POST" : "PATCH",
      path,
      input.data,
    )
  ).data;
}

export async function deleteConference(id: number) {
  await apiRequest("DELETE", `/api/conferences/${String(id)}`);
}

export async function fetchProgress(studentId: number) {
  return (
    await apiGet<ProgressDto[]>(`/api/students/${String(studentId)}/progress`)
  ).data;
}

export async function saveProgress(input: {
  studentId: number;
  id: number | null;
  data: z.output<typeof progressSchema>;
}) {
  const path =
    input.id === null
      ? `/api/students/${String(input.studentId)}/progress`
      : `/api/progress/${String(input.id)}`;
  return (
    await apiRequest<ProgressDto>(
      input.id === null ? "POST" : "PATCH",
      path,
      input.data,
    )
  ).data;
}

export async function deleteProgress(id: number) {
  await apiRequest("DELETE", `/api/progress/${String(id)}`);
}

export async function fetchHomeVisits(studentId: number) {
  return (
    await apiGet<HomeVisitDto[]>(
      `/api/students/${String(studentId)}/home-visits`,
    )
  ).data;
}

export async function saveHomeVisit(input: {
  studentId: number;
  id: number | null;
  data: z.output<typeof homeVisitSchema>;
}) {
  const path =
    input.id === null
      ? `/api/students/${String(input.studentId)}/home-visits`
      : `/api/home-visits/${String(input.id)}`;
  return (
    await apiRequest<HomeVisitDto>(
      input.id === null ? "POST" : "PATCH",
      path,
      input.data,
    )
  ).data;
}

export async function deleteHomeVisit(id: number) {
  await apiRequest("DELETE", `/api/home-visits/${String(id)}`);
}
