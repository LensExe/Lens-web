import axios from "axios";

// Axios instance. In the UI phase, requests to `/api/*` are intercepted by MSW
// (see src/msw) — no real backend runs. To point at a real backend later, set
// VITE_API_URL and disable mocking (VITE_API_MOCKING=disabled in .env).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});
