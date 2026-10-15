import type { UUID } from "./common";

/** Photographer booking-plan DTOs and response model. */
export interface BookingPlanCreateDto {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  photo_count: number;
  retouched_photo_count: number;
  delivery_days?: number | null;
  features?: string[];
}

export interface BookingPlanUpdateDto extends Partial<BookingPlanCreateDto> {
  is_active?: boolean;
}

export interface ApiBookingPlan {
  id: UUID;
  photographer_id?: UUID;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  photo_count: number;
  retouched_photo_count: number;
  delivery_days?: number | null;
  features?: string[];
  is_active?: boolean;
  [key: string]: unknown;
}
