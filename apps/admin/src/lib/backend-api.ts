import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/backend-api";

/** Set VITE_BACKEND_API_URL to the backend origin (without an `/api` suffix). */
export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "lens.admin.access-token";
const REFRESH_KEY = "lens.admin.refresh-token";
let accessToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();
let refreshToken: string | null = (() => {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
})();
let refreshPromise: Promise<string | null> | null = null;
let loginRedirectStarted = false;

export function setBackendTokens(
  tokens: { accessToken: string; refreshToken: string } | null,
): void {
  if (tokens) loginRedirectStarted = false;
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
  try {
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem("lens.admin.session");
    }
  } catch {
    /* Keep the current tab authenticated when storage is unavailable. */
  }
}

backendApi.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
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
  if (typeof window === "undefined" || window.location.pathname === "/login" || loginRedirectStarted) {
    return;
  }
  loginRedirectStarted = true;
  window.location.replace("/login");
}

function hasStoredAdminSession(): boolean {
  try {
    return localStorage.getItem("lens.admin.session") !== null;
  } catch {
    return false;
  }
}

backendApi.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const config = error.config as RetriableConfig | undefined;
  if (!config || isPublicAuthRequest(config.url)) throw error;

  const hasAccessToken = String(config.headers.get("Authorization") ?? "").startsWith("Bearer ");
  if (config._lensRetried || !refreshToken) {
    if (hasAccessToken || hasStoredAdminSession()) expireSessionAndRedirect();
    throw error;
  }

  config._lensRetried = true;
  refreshPromise ??= axios
    .post<ApiResponse<{ access_token: string; refresh_token: string }>>(
      `${backendApi.defaults.baseURL ?? ""}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } },
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

  const nextAccessToken = await refreshPromise;
  if (!nextAccessToken) {
    expireSessionAndRedirect();
    throw error;
  }
  config.headers.set("Authorization", `Bearer ${nextAccessToken}`);
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

export function backendGet<T>(path: string, params?: AxiosRequestConfig["params"]): Promise<T> {
  return unwrap(backendApi.get<ApiResponse<T>>(path, { params }));
}

export function backendPost<T, Body = undefined>(path: string, body?: Body): Promise<T> {
  return unwrap(backendApi.post<ApiResponse<T>>(path, body));
}

export function backendPatch<T, Body>(path: string, body: Body): Promise<T> {
  return unwrap(backendApi.patch<ApiResponse<T>>(path, body));
}
