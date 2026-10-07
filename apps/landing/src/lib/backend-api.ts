import axios, { type AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/backend-api";

/** Set VITE_BACKEND_API_URL to the backend origin (without an `/api` suffix). */
const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
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
