import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { API_STYLE_CODES, photographyStyleForLabel, STYLE_LABELS } from "@/lib/photography-styles";
import { mockPhotographers } from "@/mock/photographers";
import { mockStyles } from "@/mock/styles";
import type { Photographer, StyleCategory } from "@/types";
import type { ApiFeaturedStyle, ApiPhotographer, PhotographyStyle } from "@/types/backend-api";

function toApiPhotographer(photographer: Photographer): ApiPhotographer {
  return {
    id: photographer.id,
    fullname: photographer.name,
    avatar_url: photographer.avatar,
    styles: photographer.styles
      .map(photographyStyleForLabel)
      .filter((style): style is PhotographyStyle => style !== undefined),
    started_career_at: photographer.experienceYears
      ? new Date().getFullYear() - photographer.experienceYears
      : null,
    is_verified: true,
    verification_status: "verified",
    location: photographer.city,
    is_available: true,
    description: photographer.bio,
    starting_price: photographer.pricePerSession,
    cover_url: photographer.cover,
    rating: {
      average_rating: photographer.rating,
      total_feedbacks: photographer.reviewCount,
      total_bookings: 0,
      return_customers: 0,
    },
  };
}

// Mock backend for landing. Handlers play the role of the server: they read the
// mock data ("database seed") and answer the HTTP requests the services make.
// `delay()` simulates network latency so loading skeletons stay visible.

export const handlers = [
  // GET /api/v1/photographers/styles/featured → one public photographer per style.
  http.get("/api/v1/photographers/styles/featured", async () => {
    await delay();
    const data: ApiFeaturedStyle[] = API_STYLE_CODES.map((style) => {
      const featured = mockPhotographers.find((photographer) =>
        photographer.styles.includes(STYLE_LABELS[style]),
      );
      return { style, representative: featured ? toApiPhotographer(featured) : null };
    });
    return HttpResponse.json(data);
  }),

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

  // GET /api/styles → every style + how many photographers offer it.
  http.get("/api/styles", async () => {
    await delay();
    const data: StyleCategory[] = mockStyles.map((s) => ({
      ...s,
      photographerCount: mockPhotographers.filter((p) => p.styles.includes(s.label))
        .length,
    }));
    return HttpResponse.json(data);
  }),

];
