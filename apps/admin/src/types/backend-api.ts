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
  refresh_token: string;
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
