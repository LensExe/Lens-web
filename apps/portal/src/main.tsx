import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ThemeProvider, TooltipProvider, Toaster } from "@lens/ui";
import "./index.css";
import App from "./App.tsx";
import { RouteError } from "./components/RouteError";

function retryQuery(failureCount: number, error: unknown) {
  if ((error as { code?: string } | null)?.code === "ERR_HTML_RESPONSE") return false;
  if (
    isAxiosError(error) &&
    error.response &&
    error.response.status >= 400 &&
    error.response.status < 500
  ) {
    return false;
  }
  return failureCount < 3;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Retrying a client error (especially 429) repeats a request that will
      // not succeed without a user or server-side state change.
      retry: retryQuery,
    },
  },
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});

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
