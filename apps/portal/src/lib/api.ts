import axios, { AxiosError } from "axios";
import { sessionUser } from "@/lib/session";
import { mockReady } from "@/lib/mockReady";

// Axios instance. In the UI phase, requests to `/api/*` are intercepted by MSW
// (see src/msw) — no real backend runs. To point at a real backend later, set
// VITE_API_URL and disable mocking (VITE_API_MOCKING=disabled in .env).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// UI-phase auth stand-in: tell the mock backend who is signed in so it can scope
// data to the current user. In Phase 2 this becomes a real Bearer token.
api.interceptors.request.use(async (config) => {
  // Hold requests until the mock worker is ready (no-op once mocking is off),
  // so the app can render immediately without missing the mock on first load.
  await mockReady;
  // Guests browse anonymously — no user id to send.
  if (sessionUser) config.headers.set("X-User-Id", sessionUser.id);
  return config;
});

// A response that is HTML instead of JSON means the request never reached the
// API — in the UI phase usually because the mock worker is not running (e.g. a
// page restored from the back/forward cache) and the dev server answered with
// index.html. Fail loudly instead of handing a web page to the views as data.
const INVALID_RESPONSE = "Máy chủ phản hồi không hợp lệ. Vui lòng tải lại trang.";
api.interceptors.response.use((response) => {
  if (String(response.headers["content-type"] ?? "").includes("text/html")) {
    throw new AxiosError(INVALID_RESPONSE, "ERR_HTML_RESPONSE", response.config, response.request, {
      ...response,
      data: { message: INVALID_RESPONSE },
    });
  }
  return response;
});
