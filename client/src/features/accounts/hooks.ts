import type {
  TeacherListQuery,
  CenterPatchInput,
  TeacherPatchInput,
  UserStatus,
} from "@ricportal/shared";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCenter,
  createTeacher,
  fetchCenters,
  fetchParents,
  fetchTeachers,
  moveParent,
  resetParentPassword,
  resetTeacherPassword,
  updateCenter,
  updateTeacher,
  type ParentAction,
} from "./api";

export function useCenters(params: {
  q?: string;
  page: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["centers", params],
    queryFn: () => fetchCenters(params),
    placeholderData: keepPreviousData,
  });
}

function useCentersInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["centers"] });
}

export function useCreateCenter() {
  const invalidate = useCentersInvalidate();
  return useMutation({ mutationFn: createCenter, onSuccess: invalidate });
}

export function useUpdateCenter() {
  const invalidate = useCentersInvalidate();
  return useMutation({
    mutationFn: (input: { id: number; patch: CenterPatchInput }) =>
      updateCenter(input.id, input.patch),
    onSuccess: invalidate,
  });
}

export function useTeachers(page: number, filters: TeacherListQuery = {}) {
  return useQuery({
    queryKey: ["teachers", page, filters],
    queryFn: () => fetchTeachers(page, filters),
    placeholderData: keepPreviousData,
  });
}

function useTeachersInvalidate() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["teachers"] }),
      client.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useCreateTeacher() {
  const invalidate = useTeachersInvalidate();
  return useMutation({ mutationFn: createTeacher, onSuccess: invalidate });
}

export function useUpdateTeacher() {
  const invalidate = useTeachersInvalidate();
  return useMutation({
    mutationFn: (input: { id: number; patch: TeacherPatchInput }) =>
      updateTeacher(input.id, input.patch),
    onSuccess: invalidate,
  });
}

export function useResetTeacherPassword() {
  return useMutation({ mutationFn: resetTeacherPassword });
}

export function useParents(params: {
  status?: UserStatus | undefined;
  page: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["parents", params],
    queryFn: () => fetchParents(params),
    placeholderData: keepPreviousData,
  });
}

export function useMoveParent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; action: ParentAction }) =>
      moveParent(input.id, input.action),
    onSuccess: () => client.invalidateQueries({ queryKey: ["parents"] }),
  });
}

export function useResetParentPassword() {
  return useMutation({ mutationFn: resetParentPassword });
}
