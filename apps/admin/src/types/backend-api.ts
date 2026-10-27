/** Admin API request DTOs mirrored from lens-backend. */
export type UUID = string;

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type ApiObject = Record<string, unknown>;

export interface AdminDashboardData {
  users: number;
  bookings: number;
  photographers: number;
  open_reports: number;
  paid_volume_vnd: number;
}

export interface AdminDashboardAnalyticsData {
  monthly: Array<{ month: string; bookings: number; paid_volume_vnd: number }>;
  booking_by_style: Array<{ style: string; bookings: number }>;
  booking_by_location: Array<{ location: string; bookings: number }>;
  recent_activity: Array<{
    id: UUID;
    kind: "booking" | "report";
    title: string;
    detail: string;
    status: string;
    created_at: string;
  }>;
}

export type BookingLifecycleStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired"
  | "in_progress"
  | "shot"
  | "completed";

export interface BookingPlanSnapshotData {
  name: string;
  photo_count?: number;
  retouched_photo_count?: number;
  duration_minutes?: number;
  delivery_days?: number | null;
}

export interface AdminBookingParticipantData {
  fullname: string;
  avatar_url?: string | null;
  styles?: string[];
  email?: string;
  phone_number?: string | null;
}

export interface AdminBookingDetailData {
  id: UUID;
  customer_id: UUID;
  photographer_id: UUID;
  booking_plan_id: UUID;
  package_snapshot?: BookingPlanSnapshotData | null;
  booking_plan?: BookingPlanSnapshotData;
  customer?: AdminBookingParticipantData;
  photographer?: AdminBookingParticipantData;
  location: string;
  from: string;
  to: string;
  deposit_amount: number;
  total_amount: number;
  paid_amount: number;
  gallery_photo_count: number;
  status: BookingLifecycleStatus;
  accepted_at?: string | null;
  gallery_published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminBookingTimelineEventData {
  id: UUID;
  booking_id: UUID;
  from_status: BookingLifecycleStatus | null;
  to_status: BookingLifecycleStatus;
  actor_role: "customer" | "photographer" | "admin" | "system";
  actor_user_id: UUID | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminFinanceSummaryData {
  walletReserve: number;
  pendingWithdrawalTotal: number;
  pendingCount: number;
}

export interface AdminQueueData {
  pendingApplications: number;
  pendingWithdrawals: number;
  pendingWithdrawalTotal: number;
  overQuota: number;
  suspendedUsers: number;
}

export interface AdminStorageRowData {
  photographerId: UUID;
  userId: UUID;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  planCode: string;
  usedBytes: number;
  quotaBytes: number | null;
  galleryCount: number;
  overQuota: boolean;
}

export interface AdminStorageReportData {
  overview: {
    totalUsedBytes: number;
    overQuotaCount: number;
    planBreakdown: Record<string, number>;
  };
  rows: AdminStorageRowData[];
  total: number;
  offset: number;
  limit: number;
}

export interface AdminStorageQueryDto extends PageQueryDto {
  over_quota?: boolean;
}

export interface ApiUser {
  id: UUID;
  keycloak_id: string;
  fullname: string;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AuthLoginDto {
  email: string;
  password: string;
}

export interface AuthRefreshDto {
  refresh_token?: string;
}

export interface AuthLogoutDto {
  refresh_token?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
  token_type?: string;
}

export interface PageQueryDto {
  limit?: number;
  offset?: number;
}

export interface AdminUsersQueryDto extends PageQueryDto {
  status?: "active" | "suspended";
  keyword?: string;
}

export interface IdentityStatusDto {
  status: "active" | "suspended";
}

export interface PhotographerAdminQueryDto extends PageQueryDto {
  verification_status?: "unverified" | "pending" | "verified" | "rejected";
}

export interface ReasonDto {
  reason: string;
}

export interface CustomerAdminQueryDto extends PageQueryDto {
  keyword?: string;
  location?: string;
}

export interface BookingAdminQueryDto extends PageQueryDto {
  user_id?: UUID;
  status?:
    | "pending"
    | "accepted"
    | "rejected"
    | "cancelled"
    | "expired"
    | "in_progress"
    | "shot"
    | "completed";
}

export interface ReportListQueryDto extends PageQueryDto {
  status?: "open" | "resolved" | "rejected" | "escalated";
  target_type?: "user" | "booking" | "photographer" | "portfolio" | "feedback";
}

export interface ReportResolveDto {
  status: "resolved" | "rejected" | "escalated";
  resolution: string;
}

export type ModerationReportStatus = "open" | "resolved" | "rejected" | "escalated";
export type ModerationReportTargetType =
  "user" | "booking" | "photographer" | "portfolio" | "feedback";

export interface AdminReportEvidenceData {
  id: UUID;
  status: string;
  content_type: string;
  file_size: number;
  visibility: string;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  download_url?: string | null;
  expires_in?: number | null;
}

export interface AdminReportHistoryData {
  id: UUID;
  report_id: UUID;
  event_type: string;
  from_status?: ModerationReportStatus | null;
  to_status: ModerationReportStatus;
  actor_user_id?: UUID | null;
  actor_role: "user" | "admin" | "system";
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminReportData {
  id: UUID;
  user_id: UUID;
  target_type: ModerationReportTargetType;
  target_id: UUID;
  booking_issue_type?: string | null;
  reason: string;
  status: ModerationReportStatus;
  resolution?: string | null;
  resolved_by?: UUID | null;
  evidence_media_ids?: UUID[];
  created_at: string;
  updated_at: string;
}

export interface AdminReportDetailData extends AdminReportData {
  evidence: AdminReportEvidenceData[];
  history: AdminReportHistoryData[];
}

export interface ReviewAdminQueryDto extends PageQueryDto {
  status?: "visible" | "deleted_by_author" | "hidden_by_admin";
  photographer_id?: UUID;
}

export interface ReviewHideDto {
  reason: string;
}

export interface PaymentAdminQueryDto extends PageQueryDto {
  status?: string;
  review_required?: "true" | "false";
}

export interface RefundQueueQueryDto extends PageQueryDto {
  status?: "requested" | "approved" | "rejected" | "completed";
}

export interface PayoutDestinationDto {
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface RefundReviewDto {
  reason?: string;
  payout_destination?: PayoutDestinationDto;
}

export interface RefundCompleteDto {
  payout_reference?: string;
}

export interface DeadlineExtensionDto {
  hours: number;
  reason: string;
}

export interface SubscriptionPaymentReviewDto {
  outcome: "activate" | "refund" | "unpaid";
  note: string;
  provider_reference?: string;
}

export interface RankUpdateDto {
  name?: string;
  min_completed?: number;
  commission_percent?: number;
}

export interface BadgeUpdateDto {
  name?: string;
  description?: string;
  min_value?: number;
  min_reviews?: number;
  is_active?: boolean;
}
