import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Browser-side MSW worker. Started conditionally from main.tsx when
// VITE_API_MOCKING=enabled. The worker script lives at public/mockServiceWorker.js.
export const worker = setupWorker(...handlers);
