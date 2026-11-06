import type { studentPatchSchema } from "@ricportal/shared";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { z } from "zod";
import {
  createStudent,
  deleteConference,
  deleteHomeVisit,
  fetchConferences,
  fetchHomeVisits,
  fetchStudent,
  fetchStudents,
  fetchSummary,
  saveConference,
  saveHomeVisit,
  setStudentArchived,
  updateStudent,
  type StudentListParams,
} from "./api";

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: ["students", "list", params],
    queryFn: () => fetchStudents(params),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ["students", "one", id],
    queryFn: () => fetchStudent(id),
  });
}

export function useStudentSummary() {
  return useQuery({
    queryKey: ["students", "summary"],
    queryFn: fetchSummary,
  });
}

function useInvalidateStudents() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["students"] });
}

export function useCreateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({ mutationFn: createStudent, onSuccess: invalidate });
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (input: {
      id: number;
      data: z.output<typeof studentPatchSchema>;
    }) => updateStudent(input.id, input.data),
    onSuccess: invalidate,
  });
}

export function useSetStudentArchived() {
  const invalidate = useInvalidateStudents();
  return useMutation({
    mutationFn: (input: { id: number; archived: boolean }) =>
      setStudentArchived(input.id, input.archived),
    onSuccess: invalidate,
  });
}

export function useConferences(studentId: number) {
  return useQuery({
    queryKey: ["conferences", studentId],
    queryFn: () => fetchConferences(studentId),
  });
}

export function useSaveConference(studentId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveConference,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["conferences", studentId] }),
  });
}

export function useDeleteConference(studentId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteConference,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["conferences", studentId] }),
  });
}

export function useHomeVisits(studentId: number) {
  return useQuery({
    queryKey: ["home-visits", studentId],
    queryFn: () => fetchHomeVisits(studentId),
  });
}

export function useSaveHomeVisit(studentId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveHomeVisit,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["home-visits", studentId] }),
  });
}

export function useDeleteHomeVisit(studentId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteHomeVisit,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["home-visits", studentId] }),
  });
}
