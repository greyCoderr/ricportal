import type {
  ChangePasswordInput,
  LoginEventDto,
  LoginInput,
  ParentSignupInput,
  ProfileActivityDto,
  ProfileDto,
  ProfileUpdateInput,
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

export async function fetchProfile(): Promise<ProfileDto> {
  return (await apiGet<ProfileDto>("/api/auth/profile")).data;
}

export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<ProfileDto> {
  return (await apiRequest<ProfileDto>("PATCH", "/api/auth/profile", input))
    .data;
}

export async function fetchProfileActivity(): Promise<ProfileActivityDto> {
  return (await apiGet<ProfileActivityDto>("/api/auth/profile/activity")).data;
}

export async function fetchRecentLogins(): Promise<LoginEventDto[]> {
  return (await apiGet<LoginEventDto[]>("/api/auth/logins")).data;
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
