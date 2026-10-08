import type { ISODateTime, PageQueryDto, UUID } from "./common";

/** Booking creation, listing, and lifecycle DTOs. */
export type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired"
  | "in_progress"
  | "shot"
  | "completed";

export interface BookingListQueryDto extends PageQueryDto {
  status?: BookingStatus;
  from?: ISODateTime;
  to?: ISODateTime;
}

export interface BookingCreateDto {
  photographer_id: UUID;
  booking_plan_id: UUID;
  location: string;
  from: ISODateTime;
  to: ISODateTime;
}

export interface BookingReasonDto { reason: string }

export interface ApiBooking {
  id: UUID;
  customer_id?: UUID;
  photographer_id: UUID;
  booking_plan_id: UUID;
  status: BookingStatus;
  from: ISODateTime;
  to: ISODateTime;
  location: string;
  deposit_amount: number;
  total_amount: number;
  [key: string]: unknown;
}
