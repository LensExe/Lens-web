import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, TooltipProvider, Toaster } from "@lens/ui";
import { markMockReady } from "./lib/mockReady";
import "./index.css";
import App from "./App.tsx";
import { RouteError } from "./components/RouteError";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // An HTML-instead-of-JSON response will not fix itself — fail fast.
      retry: (count, error) =>
        (error as { code?: string }).code !== "ERR_HTML_RESPONSE" && count < 3,
    },
  },
});

// Start the MSW mock API when mocking is enabled (UI phase). Dynamic import
// keeps MSW out of the bundle when disabled. We do NOT block rendering on it —
// requests wait in the axios interceptor (mockReady) until the worker is online,
// so the UI paints immediately (with loading skeletons) on first load.
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== "enabled") {
    markMockReady();
    return;
  }
  try {
    const { worker } = await import("./msw/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  } catch (err) {
    // If the worker can't start, don't wedge the app: log and fall through so
    // markMockReady() still runs — queued requests then hit the network and
    // surface as visible query errors instead of an endless skeleton.
    console.error("MSW worker failed to start", err);
  } finally {
    markMockReady();
  }
}

// A page restored from the back/forward cache keeps its old JS state, but the
// mock worker unregistered itself when we navigated away and the session may
// have changed (logout). Start fresh instead of running on stale state.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});

enableMocking();

// A data router (needed for useBlocker — "leave without saving?" prompts). The
// whole <Routes> tree in App stays as-is under one splat route.
const router = createBrowserRouter([
  { path: "*", element: <App />, errorElement: <RouteError /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
