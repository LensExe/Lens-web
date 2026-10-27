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

export type BookingReportCategory =
  | "photo_quality"
  | "missing_deliverables"
  | "late_delivery"
  | "photographer_conduct"
  | "booking_mismatch"
  | "payment_refund"
  | "other";

export interface BookingDisputeCommandDto {
  booking_issue_type: BookingReportCategory;
  reason: string;
  evidence_media_ids: UUID[];
}

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
  paid_amount?: number;
  gallery_published_at?: ISODateTime | null;
  gallery_photo_count?: number;
  package_snapshot?: {
    name: string;
    photo_count?: number;
    retouched_photo_count?: number;
    duration_minutes?: number;
    delivery_days?: number | null;
  } | null;
  photographer?: {
    fullname?: string;
    avatar_url?: string | null;
    styles?: string[];
  };
  customer?: {
    fullname?: string;
    avatar_url?: string | null;
  };
  booking_plan?: {
    name?: string;
    photo_count?: number;
    retouched_photo_count?: number;
    duration_minutes?: number;
    delivery_days?: number | null;
  };
  [key: string]: unknown;
}
