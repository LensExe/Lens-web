import type { PageQueryDto, UUID } from "./common";

/** User report and moderation DTOs. */
export type ReportTargetType = "user" | "booking" | "photographer" | "portfolio" | "feedback";

export interface ReportCreateDto {
  target_type: ReportTargetType;
  target_id: UUID;
  reason: string;
  evidence_media_ids?: UUID[];
}

export type ModerationMineQueryDto = PageQueryDto;
