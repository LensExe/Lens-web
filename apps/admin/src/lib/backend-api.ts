import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/backend-api";

/** Accept an API origin, `/api`, or the full `/api/v1` base path. */
function normalizeBackendBaseURL(value?: string): string {
  const base = value?.trim().replace(/\/+$/, "") ?? "";
  if (!base) return "/api/v1";
  if (/\/api\/v1$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}

const backendBaseURL = normalizeBackendBaseURL(import.meta.env.VITE_BACKEND_API_URL);
const AUTH_MODE_HEADER = "X-Lens-Auth-Mode";
const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE = "csrf_token";
const SESSION_COOKIE = "lens.admin.session";
const LEGACY_ACCESS_TOKEN_KEY = "lens.admin.access-token";
const LEGACY_REFRESH_TOKEN_KEY = "lens.admin.refresh-token";
const LEGACY_SESSION_KEY = "lens.admin.session";

export const backendApi = axios.create({
  baseURL: backendBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    [AUTH_MODE_HEADER]: "cookie",
  },
});

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return entry.slice(prefix.length);
  }
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`;
}

type ApiResponse<T> = T | ApiEnvelope<T>;

function isApiEnvelope<T>(value: ApiResponse<T>): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

function unwrapPayload<T>(payload: ApiResponse<T>): T {
  return isApiEnvelope(payload) ? payload.data : payload;
}

function readLegacyRefreshToken(): string | null {
  try {
    const directToken = localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
    const legacySession = JSON.parse(localStorage.getItem(LEGACY_SESSION_KEY) ?? "null") as {
      refreshToken?: unknown;
    } | null;
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    return directToken || (typeof legacySession?.refreshToken === "string"
      ? legacySession.refreshToken
      : null);
  } catch {
    try {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
    } catch {
      /* Storage may be blocked. */
    }
    return null;
  }
}

function refreshHeaders(): Record<string, string> {
  const headers: Record<string, string> = { [AUTH_MODE_HEADER]: "cookie" };
  const csrfToken = readCookie(CSRF_COOKIE);
  if (csrfToken) headers[CSRF_HEADER] = csrfToken;
  return headers;
}

async function exchangeRefreshCookie(refreshToken?: string): Promise<void> {
  await axios.post(
    `${backendBaseURL}/auth/refresh`,
    refreshToken ? { refresh_token: refreshToken } : {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...refreshHeaders() },
    },
  );
}

const legacyRefreshToken = readLegacyRefreshToken();
const legacySessionMigration: Promise<boolean> = legacyRefreshToken
  ? exchangeRefreshCookie(legacyRefreshToken).then(() => true).catch(() => false)
  : Promise.resolve(false);

let refreshPromise: Promise<boolean> | null = null;
let loginRedirectStarted = false;

type RetriableConfig = InternalAxiosRequestConfig & { _lensRetried?: boolean };

function isPublicAuthRequest(url?: string): boolean {
  return !!url && [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password/",
    "/keycloak/google/login",
    "/keycloak/google/exchange",
  ].some((path) => url.includes(path));
}

function expireSessionAndRedirect(): void {
  clearCookie(SESSION_COOKIE);
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* Ignore storage cleanup errors. */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lens:auth-session-expired"));
    void axios.post(`${backendBaseURL}/auth/logout`, {}, {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...refreshHeaders() },
    }).catch(() => undefined);
  }

  if (typeof window === "undefined" || window.location.pathname === "/login" || loginRedirectStarted) {
    return;
  }
  loginRedirectStarted = true;
  window.location.replace("/login");
}

function hasStoredAdminSession(): boolean {
  return readCookie(SESSION_COOKIE) !== null;
}

export async function logoutBackendSession(): Promise<void> {
  await backendApi.post("/auth/logout", {}).catch(() => undefined);
}

/** Refresh the access and refresh cookies without exposing either token to JavaScript. */
export function refreshBackendAccessToken(): Promise<boolean> {
  refreshPromise ??= legacySessionMigration
    .then((migrated) => migrated || exchangeRefreshCookie().then(() => true))
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
        return false;
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

backendApi.interceptors.request.use((config) => {
  config.withCredentials = true;
  config.headers.set(AUTH_MODE_HEADER, "cookie");
  config.headers.delete("Authorization");
  const csrfToken = readCookie(CSRF_COOKIE);
  if (csrfToken) config.headers.set(CSRF_HEADER, csrfToken);
  else config.headers.delete(CSRF_HEADER);
  return config;
});

backendApi.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const config = error.config as RetriableConfig | undefined;
  if (!config || isPublicAuthRequest(config.url)) throw error;
  if (config._lensRetried) throw error;

  config._lensRetried = true;
  let refreshed: boolean;
  try {
    refreshed = await refreshBackendAccessToken();
  } catch {
    // Keep the session UI intact while the identity provider is temporarily unavailable.
    throw error;
  }
  if (!refreshed) {
    if (hasStoredAdminSession()) expireSessionAndRedirect();
    throw error;
  }
  return backendApi.request(config);
});

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  return unwrapPayload((await request).data);
}

export function backendGet<T>(path: string, params?: AxiosRequestConfig["params"]): Promise<T> {
  return unwrap(backendApi.get<ApiResponse<T>>(path, { params }));
}

export function backendPost<T, Body = undefined>(path: string, body?: Body): Promise<T> {
  return unwrap(backendApi.post<ApiResponse<T>>(path, body));
}

export function backendPatch<T, Body>(path: string, body: Body): Promise<T> {
  return unwrap(backendApi.patch<ApiResponse<T>>(path, body));
}
