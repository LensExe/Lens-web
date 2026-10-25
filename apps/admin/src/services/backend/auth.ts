import { backendGet, backendPost } from "@/lib/backend-api";
import type {
  ApiObject,
  ApiUser,
  AuthLoginDto,
  AuthLogoutDto,
  AuthRefreshDto,
} from "@/types/backend-api";

export interface AdminAuthSession {
  user: ApiUser;
  roles?: string[];
  email_verified?: boolean;
  expires_in?: number;
}

export const login = (body: AuthLoginDto) =>
  backendPost<AdminAuthSession, AuthLoginDto>("/auth/login", body);

export const refreshToken = (body: AuthRefreshDto = {}) =>
  backendPost<{ success: boolean; expires_in?: number }, AuthRefreshDto>("/auth/refresh", body);

export const logout = (body: AuthLogoutDto = {}) =>
  backendPost<ApiObject, AuthLogoutDto>("/auth/logout", body);

export const getCurrentUser = () => backendGet<ApiObject>("/users/me");
