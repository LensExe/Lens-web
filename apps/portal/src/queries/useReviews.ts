import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookingReviews,
  getReviewSummary,
  getReviewsByPhotographer,
  submitBookingReview,
} from "@/services/reviews";
import type { BookingReviewInput } from "@/types";

// Layer 2 — Query hooks.
export const reviewKeys = {
  byPhotographer: (id: string) => ["reviews", id] as const,
  summary: (id: string) => ["reviews", id, "summary"] as const,
  mine: ["reviews", "mine"] as const,
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

export function useMyBookingReviews() {
  return useQuery({
    queryKey: reviewKeys.mine,
    queryFn: getMyBookingReviews,
  });
}

export function useSubmitBookingReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingReviewInput) => submitBookingReview(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.mine });
    },
  });
}
