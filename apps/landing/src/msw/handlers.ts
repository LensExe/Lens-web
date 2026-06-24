import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";

// Mock backend for landing. Handlers play the role of the server: they read the
// mock data ("database seed") and answer the HTTP requests the services make.
// `delay()` simulates network latency so loading skeletons stay visible.

export const handlers = [
  // GET /api/photographers  (?featured=true → only featured ones)
  http.get("/api/photographers", async ({ request }) => {
    await delay();
    const featured = new URL(request.url).searchParams.get("featured");
    const data =
      featured === "true"
        ? mockPhotographers.filter((p) => p.featured)
        : mockPhotographers;
    return HttpResponse.json(data);
  }),

  // GET /api/photographers/:id  (null body when not found, like a 200 empty)
  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ?? null);
  }),
];
