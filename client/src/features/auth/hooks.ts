import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SESSION_KEY } from "../../lib/query-client";
import {
  changePassword,
  fetchPublicCenters,
  fetchSession,
  login,
  logout,
  parentSignup,
} from "./api";

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      client.setQueryData(SESSION_KEY, user);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Nothing from the last user may stay in the cache.
      client.clear();
      client.setQueryData(SESSION_KEY, null);
    },
  });
}

export function useChangePassword() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (user) => {
      client.setQueryData(SESSION_KEY, user);
    },
  });
}

export function useParentSignup() {
  return useMutation({ mutationFn: parentSignup });
}

export function usePublicCenters() {
  return useQuery({
    queryKey: ["public-centers"],
    queryFn: fetchPublicCenters,
  });
}
