import type { PageQueryDto, UUID } from "./common";

/** User report and moderation DTOs. */
export type ReportTargetType = "user" | "booking" | "photographer" | "portfolio" | "feedback";

export interface ReportCreateDto {
  target_type: ReportTargetType;
  target_id: UUID;
  reason: string;
  evidence_media_ids?: UUID[];
}

export interface BookingReportReceipt {
  id: UUID;
  target_type: "booking";
  target_id: UUID;
  booking_issue_type: import("./bookings").BookingReportCategory | null;
  reason: string;
  status: "open" | "resolved" | "rejected" | "escalated";
  created_at: string;
  resolution?: string | null;
}

export type ModerationMineQueryDto = PageQueryDto;
