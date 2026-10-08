/** Authentication request DTOs and token response. */
export type RegistrationRole = "customer" | "photographer";

export interface AuthRegisterDto {
  role: RegistrationRole;
  fullname: string;
  email: string;
  password: string;
}

export interface AuthLoginDto {
  email: string;
  password: string;
}

export interface AuthRefreshDto {
  refresh_token: string;
}

export interface AuthLogoutDto {
  refresh_token?: string;
}

export interface AuthChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthEmailDto {
  email: string;
}
export interface AuthOtpDto {
  email: string;
  otp: string;
}

export interface AuthResetPasswordDto {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface GoogleCallbackQueryDto {
  code: string;
  state: string;
  session_state?: string;
  iss?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GoogleExchangeQueryDto {
  code: string;
}

export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
  token_type?: string;
}
