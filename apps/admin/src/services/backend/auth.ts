import { backendGet, backendPost } from "@/lib/backend-api";
import type {
  ApiObject,
  ApiUser,
  AuthLoginDto,
  AuthLogoutDto,
  AuthRefreshDto,
  AuthTokenResponse,
} from "@/types/backend-api";

export interface AdminAuthSession extends AuthTokenResponse {
  user: ApiUser;
}

export const login = (body: AuthLoginDto) =>
  backendPost<AdminAuthSession, AuthLoginDto>("/auth/login", body);

export const refreshToken = (body: AuthRefreshDto) =>
  backendPost<AuthTokenResponse, AuthRefreshDto>("/auth/refresh", body);

export const logout = (body: AuthLogoutDto = {}) =>
  backendPost<ApiObject, AuthLogoutDto>("/auth/logout", body);

export const getCurrentUser = () => backendGet<ApiObject>("/users/me");
