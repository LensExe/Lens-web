import { useQuery } from "@tanstack/react-query";
import { getReviewSummary, getReviewsByPhotographer } from "@/services/reviews";

// Layer 2 — Query hooks.
export const reviewKeys = {
  byPhotographer: (id: string) => ["reviews", id] as const,
  summary: (id: string) => ["reviews", id, "summary"] as const,
};

export function useReviews(photographerId: string) {
  return useQuery({
    queryKey: reviewKeys.byPhotographer(photographerId),
    queryFn: () => getReviewsByPhotographer(photographerId),
    enabled: !!photographerId,
  });
}

export function useReviewSummary(photographerId: string) {
  return useQuery({
    queryKey: reviewKeys.summary(photographerId),
    queryFn: () => getReviewSummary(photographerId),
    enabled: !!photographerId,
  });
}
