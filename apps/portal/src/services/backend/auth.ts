import { backendGet, backendPost } from "@/lib/backend-api";
import type { ApiObject } from "@/types/common";
import type { ApiUser } from "@/types/identity";
import type {
  AuthChangePasswordDto,
  AuthEmailDto,
  AuthLoginDto,
  AuthLogoutDto,
  AuthOtpDto,
  AuthRefreshDto,
  AuthRegisterDto,
  AuthTokenResponse,
  AuthResetPasswordDto,
  GoogleExchangeQueryDto,
} from "@/types/auth";

export interface AuthSession extends AuthTokenResponse {
  user: ApiUser;
}

export const register = (body: AuthRegisterDto) =>
  backendPost<AuthSession, AuthRegisterDto>("/auth/register", body);

export const login = (body: AuthLoginDto) =>
  backendPost<AuthSession, AuthLoginDto>("/auth/login", body);

export const refreshToken = (body: AuthRefreshDto) =>
  backendPost<AuthTokenResponse, AuthRefreshDto>("/auth/refresh", body);

export const logout = (body: AuthLogoutDto = {}) =>
  backendPost<ApiObject, AuthLogoutDto>("/auth/logout", body);

export const changePassword = (body: AuthChangePasswordDto) =>
  backendPost<ApiObject, AuthChangePasswordDto>("/auth/change-password", body);

export const sendForgotPasswordOtp = (body: AuthEmailDto) =>
  backendPost<ApiObject, AuthEmailDto>("/auth/forgot-password/send-otp", body);

export const verifyForgotPasswordOtp = (body: AuthOtpDto) =>
  backendPost<{ reset_token: string }, AuthOtpDto>("/auth/forgot-password/verify", body);

export const resetPassword = (body: AuthResetPasswordDto) =>
  backendPost<ApiObject, AuthResetPasswordDto>("/auth/forgot-password/reset", body);

export const sendEmailVerificationOtp = () =>
  backendPost<ApiObject>("/auth/email/send-otp");

export const verifyEmail = (body: AuthOtpDto) =>
  backendPost<ApiObject, AuthOtpDto>("/auth/email/verify", body);

export const getGoogleLoginUrl = () =>
  backendGet<{ authorization_url: string }>("/keycloak/google/login");

// `/keycloak/google/callback` redirects the browser; exchange its one-time code below.
export const exchangeGoogleCode = (query: GoogleExchangeQueryDto) =>
  backendGet<AuthSession>("/keycloak/google/exchange", query);
