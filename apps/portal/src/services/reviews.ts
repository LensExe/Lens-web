import { reviewApi } from "@/services/backend";
import type { ApiReview } from "@/types/reviews";
import type { ApiObject } from "@/types/common";
import type { BookingReview, BookingReviewInput, Review, ReviewSummary } from "@/types";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const num = (value: unknown) => typeof value === "number" ? value : 0;

function mapReview(row: ApiReview): Review {
  const customer = asRecord((row as ApiReview & { customer?: unknown }).customer);
  return {
    id: row.id,
    photographerId: text((row as ApiObject).photographer_id),
    authorName: text(customer.name) || "Khách hàng",
    authorAvatar: text(customer.avatar_url),
    rating: row.rating,
    comment: row.comment ?? "",
    date: text((row as ApiObject).created_at),
  };
}

export async function getReviewsByPhotographer(photographerId: string): Promise<Review[]> {
  const page = await reviewApi.listPhotographerReviews(photographerId, { limit: 100, offset: 0 });
  return page.items.map(mapReview);
}

export async function getReviewSummary(photographerId: string): Promise<ReviewSummary> {
  const row = await reviewApi.getPhotographerRatingSummary(photographerId) as ApiObject;
  const distribution = (row.distribution ?? {}) as Record<string, unknown>;
  return {
    average: num(row.average_rating),
    total: num(row.total_feedbacks),
    breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: num(distribution[String(stars)]) })),
  };
}

export async function getMyBookingReviews(): Promise<BookingReview[]> {
  throw new Error("Backend chưa có endpoint liệt kê đánh giá của khách hàng (GET /customers/me/reviews).");
}

export async function submitBookingReview(input: BookingReviewInput): Promise<BookingReview> {
  const row = await reviewApi.createBookingReview(input.bookingId, {
    rating: input.rating,
    punctuality_rating: input.rating,
    attitude_rating: input.rating,
    comment: input.comment,
  });
  return {
    id: row.id,
    bookingId: input.bookingId,
    clientId: "",
    photographerId: input.photographerId,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: text((row as ApiObject).created_at),
  };
}
