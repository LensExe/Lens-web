import { delay } from "@lens/ui";
import { mockReviews } from "@/mock/reviews";
import type { Review } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API. The ONLY place mock data is touched.

export async function getReviewsByPhotographer(
  photographerId: string
): Promise<Review[]> {
  await delay();
  return mockReviews.filter((r) => r.photographerId === photographerId); // CURRENT: mock
  // LATER: return (await api.get<Review[]>(`/photographers/${photographerId}/reviews`)).data;
}
