import { backendDelete, backendGet, backendPatch, backendPost, backendPut } from "@/lib/backend-api";
import type { ApiObject, ApiPage, PageQueryDto } from "@/types/common";
import type {
  ApiReview,
  ReviewCreateDto,
  ReviewReplyDto,
  ReviewUpdateDto,
} from "@/types/reviews";

export const createBookingReview = (bookingId: string, body: ReviewCreateDto) =>
  backendPost<ApiReview, ReviewCreateDto>(`/bookings/${encodeURIComponent(bookingId)}/reviews`, body);
export const getPhotographerRatingSummary = (photographerId: string) =>
  backendGet<ApiObject>(`/photographers/${encodeURIComponent(photographerId)}/rating-summary`);
export const listPhotographerReviews = (photographerId: string, query: PageQueryDto = {}) =>
  backendGet<ApiPage<ApiReview>>(`/photographers/${encodeURIComponent(photographerId)}/reviews`, query);
export const updateReview = (feedbackId: string, body: ReviewUpdateDto) =>
  backendPatch<ApiReview, ReviewUpdateDto>(`/reviews/${encodeURIComponent(feedbackId)}`, body);
export const deleteReview = (feedbackId: string) =>
  backendDelete<{ deleted: boolean }>(`/reviews/${encodeURIComponent(feedbackId)}`);
export const replyToReview = (feedbackId: string, body: ReviewReplyDto) =>
  backendPut<ApiReview, ReviewReplyDto>(`/reviews/${encodeURIComponent(feedbackId)}/reply`, body);
