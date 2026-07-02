import axios from "axios";
import { mockReady } from "@/lib/mockReady";

// Axios instance. In the UI phase, requests to `/api/*` are intercepted by MSW
// (see src/msw) — no real backend runs. To point at a real backend later, set
// VITE_API_URL and disable mocking (VITE_API_MOCKING=disabled in .env).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// Hold requests until the mock worker is ready (no-op once mocking is off), so
// the app can render immediately without missing the mock on first load.
api.interceptors.request.use(async (config) => {
  await mockReady;
  return config;
});
