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
  deleteProgress,
  fetchConferences,
  fetchHomeVisits,
  fetchProgress,
  fetchStudent,
  fetchStudents,
  fetchSummary,
  saveConference,
  saveHomeVisit,
  saveProgress,
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

// An entry changed: its list, and the counts on the Child's Record list.
function useInvalidateEntries(kind: string, studentId: number) {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: [kind, studentId] }),
      client.invalidateQueries({ queryKey: ["child-records"] }),
    ]);
  };
}

export function useProgress(studentId: number) {
  return useQuery({
    queryKey: ["progress", studentId],
    queryFn: () => fetchProgress(studentId),
  });
}

export function useSaveProgress(studentId: number) {
  const invalidate = useInvalidateEntries("progress", studentId);
  return useMutation({ mutationFn: saveProgress, onSuccess: invalidate });
}

export function useDeleteProgress(studentId: number) {
  const invalidate = useInvalidateEntries("progress", studentId);
  return useMutation({ mutationFn: deleteProgress, onSuccess: invalidate });
}

export function useConferences(studentId: number) {
  return useQuery({
    queryKey: ["conferences", studentId],
    queryFn: () => fetchConferences(studentId),
  });
}

export function useSaveConference(studentId: number) {
  const invalidate = useInvalidateEntries("conferences", studentId);
  return useMutation({ mutationFn: saveConference, onSuccess: invalidate });
}

export function useDeleteConference(studentId: number) {
  const invalidate = useInvalidateEntries("conferences", studentId);
  return useMutation({ mutationFn: deleteConference, onSuccess: invalidate });
}

export function useHomeVisits(studentId: number) {
  return useQuery({
    queryKey: ["home-visits", studentId],
    queryFn: () => fetchHomeVisits(studentId),
  });
}

export function useSaveHomeVisit(studentId: number) {
  const invalidate = useInvalidateEntries("home-visits", studentId);
  return useMutation({ mutationFn: saveHomeVisit, onSuccess: invalidate });
}

export function useDeleteHomeVisit(studentId: number) {
  const invalidate = useInvalidateEntries("home-visits", studentId);
  return useMutation({ mutationFn: deleteHomeVisit, onSuccess: invalidate });
}
