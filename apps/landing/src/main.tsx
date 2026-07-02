import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@lens/ui";
import { TooltipProvider } from "@lens/ui";
import { Toaster } from "@lens/ui";
import { markMockReady } from "./lib/mockReady";
import "lenis/dist/lenis.css";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
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

enableMocking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
