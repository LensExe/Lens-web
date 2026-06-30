import axios from "axios";
import { currentUser } from "@/lib/session";

// Axios instance. In the UI phase, requests to `/api/*` are intercepted by MSW
// (see src/msw) — no real backend runs. To point at a real backend later, set
// VITE_API_URL and disable mocking (VITE_API_MOCKING=disabled in .env).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// UI-phase auth stand-in: tell the mock backend who is signed in so it can scope
// data to the current user. In Phase 2 this becomes a real Bearer token.
api.interceptors.request.use((config) => {
  config.headers.set("X-User-Id", currentUser.id);
  return config;
});
