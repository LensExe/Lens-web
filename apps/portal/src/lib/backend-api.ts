import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/common";
import { portalLogin } from "@/lib/links";

/** Set VITE_BACKEND_API_URL to the backend origin (without an `/api` suffix). */
export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "lens.auth.tokens.v1";
interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

function readTokens(): StoredTokens | null {
  try {
    const value = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null") as Partial<StoredTokens> | null;
    if (!value) return null;
    const accessToken = typeof value.accessToken === "string" && value.accessToken
      ? value.accessToken
      : undefined;
    const refreshToken = typeof value.refreshToken === "string" && value.refreshToken
      ? value.refreshToken
      : undefined;
    return accessToken || refreshToken ? { accessToken, refreshToken } : null;
  } catch {
    return null;
  }
}

let inMemoryTokens: StoredTokens | null = readTokens();
let refreshPromise: Promise<string | null> | null = null;
let loginRedirectStarted = false;

/** Persist or clear Keycloak tokens used by authenticated endpoints. */
export function setBackendTokens(tokens: StoredTokens | null): void {
  inMemoryTokens = tokens;
  if (tokens) loginRedirectStarted = false;
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* The current tab can still continue with the in-memory access token. */
  }
}

backendApi.interceptors.request.use((config) => {
  const token = inMemoryTokens?.accessToken ?? readTokens()?.accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  else config.headers.delete("Authorization");
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _lensRetried?: boolean };

function isPublicAuthRequest(url?: string): boolean {
  return !!url && [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot-password/",
    "/keycloak/google/login",
    "/keycloak/google/exchange",
  ].some((path) => url.includes(path));
}

function expireSessionAndRedirect(): void {
  setBackendTokens(null);
  try {
    localStorage.removeItem("lens.session.v1");
    localStorage.removeItem("lens.session.role");
  } catch {
    /* The access token is still cleared in memory when storage is unavailable. */
  }

  if (typeof window === "undefined" || window.location.pathname === "/login" || loginRedirectStarted) {
    return;
  }
  loginRedirectStarted = true;
  window.location.replace(portalLogin(window.location.href));
}

function hasStoredPortalSession(): boolean {
  try {
    return localStorage.getItem("lens.session.v1") !== null;
  } catch {
    return false;
  }
}

backendApi.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const config = error.config as RetriableConfig | undefined;
  const tokens = inMemoryTokens ?? readTokens();
  if (!config || isPublicAuthRequest(config.url)) throw error;

  const hadAccessToken = String(config.headers.get("Authorization") ?? "").startsWith("Bearer ");
  if (config._lensRetried || !tokens?.refreshToken) {
    if (hadAccessToken || hasStoredPortalSession()) expireSessionAndRedirect();
    throw error;
  }

  config._lensRetried = true;
  refreshPromise ??= axios
    .post<ApiResponse<{ access_token: string; refresh_token: string }>>(
      `${backendApi.defaults.baseURL ?? ""}/auth/refresh`,
      { refresh_token: tokens.refreshToken },
    )
    .then(({ data }) => {
      const payload = unwrapPayload(data);
      if (typeof payload.access_token !== "string" || !payload.access_token ||
          typeof payload.refresh_token !== "string" || !payload.refresh_token) {
        throw new Error("Refresh endpoint returned an invalid token response");
      }
      const next = { accessToken: payload.access_token, refreshToken: payload.refresh_token };
      setBackendTokens(next);
      return next.accessToken;
    })
    .catch(() => {
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  const accessToken = await refreshPromise;
  if (!accessToken) {
    expireSessionAndRedirect();
    throw error;
  }
  config.headers.set("Authorization", `Bearer ${accessToken}`);
  return backendApi.request(config);
});

type ApiResponse<T> = T | ApiEnvelope<T>;

function isApiEnvelope<T>(value: ApiResponse<T>): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

function unwrapPayload<T>(payload: ApiResponse<T>): T {
  return isApiEnvelope(payload) ? payload.data : payload;
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  return unwrapPayload((await request).data);
}

export function backendGet<T>(
  path: string,
  params?: AxiosRequestConfig["params"],
): Promise<T> {
  return unwrap(backendApi.get<ApiResponse<T>>(path, { params }));
}

export function backendPost<T, Body = undefined>(
  path: string,
  body?: Body,
): Promise<T> {
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
