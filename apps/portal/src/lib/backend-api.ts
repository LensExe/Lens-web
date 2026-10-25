import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/common";
import { portalLogin } from "@/lib/links";

/** Accept an API origin, `/api`, or the full `/api/v1` base path. */
export function normalizeBackendBaseURL(value?: string): string {
  const base = value?.trim().replace(/\/+$/, "") ?? "";
  if (!base) return "/api/v1";
  if (/\/api\/v1$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}

export const backendBaseURL = normalizeBackendBaseURL(import.meta.env.VITE_BACKEND_API_URL);
const AUTH_MODE_HEADER = "X-Lens-Auth-Mode";
const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE = "csrf_token";
const SESSION_COOKIE = "lens.portal.session";
const LEGACY_TOKEN_KEY = "lens.auth.tokens.v1";
let legacySubject: string | null = null;

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

function readLegacyRefreshToken(): string | null {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_TOKEN_KEY) ?? "null") as {
      accessToken?: unknown;
      refreshToken?: unknown;
    } | null;
    if (typeof stored?.accessToken === "string") {
      try {
        const payload = stored.accessToken.split(".")[1];
        if (payload) {
          const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
          const claims = JSON.parse(atob(normalized)) as { sub?: unknown };
          if (typeof claims.sub === "string") legacySubject = claims.sub;
        }
      } catch {
        legacySubject = null;
      }
    }
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return typeof stored?.refreshToken === "string" && stored.refreshToken
      ? stored.refreshToken
      : null;
  } catch {
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      /* Storage may be blocked. */
    }
    return null;
  }
}

export function getLegacyBackendSubject(): string | null {
  return legacySubject;
}

type ApiResponse<T> = T | ApiEnvelope<T>;

function isApiEnvelope<T>(value: ApiResponse<T>): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

function unwrapPayload<T>(payload: ApiResponse<T>): T {
  return isApiEnvelope(payload) ? payload.data : payload;
}

function notifySessionRefresh(expiresAt: number): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lens:backend-session-refreshed", {
      detail: { expiresAt },
    }));
  }
}

function expiryFromResponse(data: ApiResponse<{ expires_in?: unknown }>): number {
  const expiresIn = Number(unwrapPayload(data).expires_in);
  const expiresAt = Date.now() + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1_000 : 60_000);
  notifySessionRefresh(expiresAt);
  return expiresAt;
}

function refreshHeaders(): Record<string, string> {
  const headers: Record<string, string> = { [AUTH_MODE_HEADER]: "cookie" };
  const csrfToken = readCookie(CSRF_COOKIE);
  if (csrfToken) headers[CSRF_HEADER] = csrfToken;
  return headers;
}

async function exchangeRefreshCookie(refreshToken?: string): Promise<number> {
  const { data } = await axios.post<ApiResponse<{ expires_in?: unknown }>>(
    `${backendBaseURL}/auth/refresh`,
    refreshToken ? { refresh_token: refreshToken } : {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json", ...refreshHeaders() },
    },
  );
  return expiryFromResponse(data);
}

const legacyRefreshToken = readLegacyRefreshToken();
let legacyRefreshExpiresAt: number | null = null;
const legacySessionMigration: Promise<boolean> = legacyRefreshToken
  ? exchangeRefreshCookie(legacyRefreshToken)
      .then((expiresAt) => {
        legacyRefreshExpiresAt = expiresAt;
        return true;
      })
      .catch(() => false)
  : Promise.resolve(false);

let refreshPromise: Promise<number | null> | null = null;
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
    localStorage.removeItem("lens.session.v1");
    localStorage.removeItem("lens.session.role");
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
  window.location.replace(portalLogin(window.location.href));
}

export function expireBackendSession(): void {
  expireSessionAndRedirect();
}

function hasStoredPortalSession(): boolean {
  return readCookie(SESSION_COOKIE) !== null;
}

/** Refresh the HttpOnly cookie pair and return the new access-token expiry time. */
export function refreshBackendAccessToken(): Promise<number | null> {
  refreshPromise ??= legacySessionMigration
    .then((migrated) => migrated && legacyRefreshExpiresAt
      ? legacyRefreshExpiresAt
      : exchangeRefreshCookie())
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
        return null;
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
  let expiresAt: number | null;
  try {
    expiresAt = await refreshBackendAccessToken();
  } catch {
    // Keep the current UI session when the identity provider is temporarily unavailable.
    throw error;
  }
  if (!expiresAt) {
    if (hasStoredPortalSession()) expireSessionAndRedirect();
    throw error;
  }
  return backendApi.request(config);
});

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  return unwrapPayload((await request).data);
}

export async function logoutBackendSession(): Promise<void> {
  await backendApi.post("/auth/logout", {}).catch(() => undefined);
}

export function backendGet<T>(
  path: string,
  params?: AxiosRequestConfig["params"],
): Promise<T> {
  return unwrap(backendApi.get<ApiResponse<T>>(path, { params }));
}

export function backendPost<T, Body = undefined>(path: string, body?: Body): Promise<T> {
  return unwrap(backendApi.post<ApiResponse<T>>(path, body));
}

export function backendPatch<T, Body>(path: string, body: Body): Promise<T> {
  return unwrap(backendApi.patch<ApiResponse<T>>(path, body));
}

export function backendPut<T, Body>(path: string, body: Body): Promise<T> {
  return unwrap(backendApi.put<ApiResponse<T>>(path, body));
}

export function backendDelete<T = { deleted: boolean }>(path: string): Promise<T> {
  return unwrap(backendApi.delete<ApiResponse<T>>(path));
}
