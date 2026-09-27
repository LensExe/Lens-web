import axios, { AxiosError } from "axios";
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

// Surface the backend's Vietnamese `message` as the error message, so views can
// show `error.message` directly without importing axios.
api.interceptors.response.use(undefined, (error) => {
  const message = error?.response?.data?.message;
  error.message =
    typeof message === "string" ? message : "Không thể kết nối, vui lòng thử lại";
  return Promise.reject(error);
});
