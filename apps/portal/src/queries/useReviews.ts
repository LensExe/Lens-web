import { useQuery } from "@tanstack/react-query";
import { getReviewsByPhotographer } from "@/services/reviews";

// Layer 2 — Query hooks.
export const reviewKeys = {
  byPhotographer: (id: string) => ["reviews", id] as const,
};

export function useReviews(photographerId: string) {
  return useQuery({
    queryKey: reviewKeys.byPhotographer(photographerId),
    queryFn: () => getReviewsByPhotographer(photographerId),
    enabled: !!photographerId,
  });
}
