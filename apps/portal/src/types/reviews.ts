import type { UUID } from "./common";

/** Review creation, update, reply, and response types. */
export interface ReviewCreateDto {
  rating: number;
  punctuality_rating: number;
  attitude_rating: number;
  comment?: string;
}

export type ReviewUpdateDto = Partial<ReviewCreateDto>;
export interface ReviewReplyDto { reply: string }

export interface ApiReview {
  id: UUID;
  rating: number;
  punctuality_rating: number;
  attitude_rating: number;
  comment?: string;
  [key: string]: unknown;
}
