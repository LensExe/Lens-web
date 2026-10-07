import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, TooltipProvider, Toaster } from "@lens/ui";
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
