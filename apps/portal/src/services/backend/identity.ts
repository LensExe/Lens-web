import { backendGet, backendPatch } from "@/lib/backend-api";
import type { ApiPublicUser, ApiUser, UpdateMyIdentityDto } from "@/types/identity";

export const getMe = () => backendGet<ApiUser>("/users/me");

export const updateMe = (body: UpdateMyIdentityDto) =>
  backendPatch<ApiUser, UpdateMyIdentityDto>("/users/me", body);

export const getUserById = (userId: string) =>
  backendGet<ApiPublicUser>(`/users/${encodeURIComponent(userId)}`);
