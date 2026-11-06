import type {
  ChangePasswordInput,
  LoginInput,
  ParentSignupInput,
  PublicCenter,
  SessionUser,
  SignupResult,
} from "@ricportal/shared";
import { ApiError, apiGet, apiRequest } from "../../lib/api";

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    return (await apiGet<SessionUser>("/api/auth/me")).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<SessionUser> {
  return (await apiRequest<SessionUser>("POST", "/api/auth/login", input)).data;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<SessionUser> {
  return (
    await apiRequest<SessionUser>("POST", "/api/auth/change-password", input)
  ).data;
}

export async function parentSignup(
  input: ParentSignupInput,
): Promise<SignupResult> {
  return (
    await apiRequest<SignupResult>("POST", "/api/auth/parent-signup", input)
  ).data;
}

export async function fetchPublicCenters(): Promise<PublicCenter[]> {
  return (await apiGet<PublicCenter[]>("/api/public/centers")).data;
}
