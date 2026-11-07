import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SESSION_KEY } from "../../lib/query-client";
import {
  changePassword,
  fetchProfile,
  fetchPublicCenters,
  fetchSession,
  login,
  logout,
  parentSignup,
  updateProfile,
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

const PROFILE_KEY = ["profile"] as const;

export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      client.setQueryData(PROFILE_KEY, profile);
      // The top bar shows the name from the session.
      void client.invalidateQueries({ queryKey: SESSION_KEY });
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
