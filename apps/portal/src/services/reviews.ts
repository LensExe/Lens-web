import { api } from "@/lib/api";
import type {
  BookingReview,
  BookingReviewInput,
  Review,
  ReviewSummary,
} from "@/types";

// Layer 3 — Service / API. Thin HTTP call; the mock backend (src/msw) answers it.

export async function getReviewsByPhotographer(
  photographerId: string
): Promise<Review[]> {
  return (
    await api.get<Review[]>(`/photographers/${photographerId}/reviews`)
  ).data;
}

export async function getReviewSummary(photographerId: string): Promise<ReviewSummary> {
  return (
    await api.get<ReviewSummary>(`/photographers/${photographerId}/reviews/summary`)
  ).data;
}

export async function getMyBookingReviews(): Promise<BookingReview[]> {
  return (await api.get<BookingReview[]>("/me/reviews")).data;
}

export async function submitBookingReview(
  input: BookingReviewInput,
): Promise<BookingReview> {
  return (await api.post<BookingReview>("/me/reviews", input)).data;
}
