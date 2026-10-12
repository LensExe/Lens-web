import axios, { type AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/backend-api";

/** Accept an API origin, `/api`, or the full `/api/v1` base path. */
export function normalizeBackendBaseURL(value?: string): string {
  const base = value?.trim().replace(/\/+$/, "") ?? "";
  if (!base) return "/api/v1";
  if (/\/api\/v1$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}

const client = axios.create({
  baseURL: normalizeBackendBaseURL(import.meta.env.VITE_BACKEND_API_URL),
  headers: { "Content-Type": "application/json" },
});

function isApiEnvelope<T>(value: T | ApiEnvelope<T>): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

async function unwrap<T>(request: Promise<{ data: T | ApiEnvelope<T> }>): Promise<T> {
  const payload = (await request).data;
  return isApiEnvelope(payload) ? payload.data : payload;
}

export function backendGet<T>(path: string, params?: AxiosRequestConfig["params"]): Promise<T> {
  return unwrap(client.get<T | ApiEnvelope<T>>(path, { params }));
}
