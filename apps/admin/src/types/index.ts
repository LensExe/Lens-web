// Admin domain types for the Lens console (UI-only phase).

export type ApprovalStatus = "pending" | "approved" | "rejected";

/** A photographer's submitted profile awaiting moderation. */
export interface PhotographerApplication {
  id: string;
  name: string;
  avatar: string;
  email: string;
  city: string;
  styles: string[];
  experienceYears: number;
  /** Giá khởi điểm / buổi (VND). */
  pricePerSession: number;
  /** Portfolio shots submitted for review (image URLs). */
  portfolio: string[];
  bio: string;
  /** ISO date string the application was submitted. */
  submittedAt: string;
  status: ApprovalStatus;
  /** The admin's note on the decision — always present on a rejection. */
  reviewNote?: string;
  /** ISO datetime of the decision. */
  reviewedAt?: string;
}

/** Approve, or reject with a reason the applicant will see. */
export interface ApplicationDecision {
  status: "approved" | "rejected";
  note?: string;
}

export type UserRole = "client" | "photographer";
export type UserStatus = "active" | "suspended";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  city: string;
  /** ISO date string the user joined. */
  joinedAt: string;
  bookingsCount: number;
}

/** Headline numbers + activity feed for the overview screen. */
export interface OverviewStats {
  totalUsers: number;
  totalPhotographers: number;
  totalBookings: number;
  /** Doanh thu tháng này (VND). */
  monthlyRevenue: number;
  /** % change of each headline number vs last month. */
  change: { users: number; photographers: number; bookings: number; revenue: number };
}

/** What's waiting on an admin — drives the overview queue and sidebar badges. */
export interface AdminQueue {
  pendingApplications: number;
  pendingWithdrawals: number;
  /** VND. */
  pendingWithdrawalTotal: number;
  overQuota: number;
  suspendedUsers: number;
}

export interface ActivityItem {
  id: string;
  type: "signup" | "booking" | "application" | "report" | "withdrawal";
  text: string;
  /** ISO datetime string. */
  at: string;
}

export interface MonthlyPoint {
  /** Short label, e.g. "T1". */
  month: string;
  bookings: number;
  /** VND. */
  revenue: number;
}

export interface Breakdown {
  label: string;
  count: number;
}

export interface ReportData {
  monthly: MonthlyPoint[];
  byStyle: Breakdown[];
  byCity: Breakdown[];
}

// ── Finance & withdrawals (Feature: Ví + Lens Xu) ───────────────────────────
export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface AdminWithdrawal {
  id: string;
  photographerId: string;
  photographerName: string;
  avatar: string;
  /** VND. */
  amount: number;
  /** ISO datetime the withdrawal was requested. */
  requestedAt: string;
  status: WithdrawalStatus;
}

export interface FinanceSummary {
  /** Tổng tiền thật đang giữ trong ví thợ (VND). */
  walletReserve: number;
  /** Tổng Lens Xu đang lưu hành (xu). */
  coinsOutstanding: number;
  /** Tổng tiền các yêu cầu rút đang chờ duyệt (VND). */
  pendingWithdrawalTotal: number;
  pendingCount: number;
}

// ── Bookings & collaboration (Feature: liên kết thợ) ────────────────────────
export type EscrowStatus =
  | "awaiting_deposit"
  | "pending"
  | "confirmed"
  | "held"
  | "released"
  | "cancelled";

export interface AdminCollaborator {
  name: string;
  avatar?: string;
  /** Payout share 0–100. */
  sharePct: number;
  status: "invited" | "accepted" | "declined";
}

export interface AdminBooking {
  id: string;
  clientName: string;
  clientAvatar?: string;
  photographerName: string;
  photographerAvatar?: string;
  collaborators?: AdminCollaborator[];
  style: string;
  /** ISO date string. */
  date: string;
  /** VND. */
  price: number;
  status: EscrowStatus;
}

export interface BookingSummary {
  /** Money the platform holds right now — deposits + fully paid shoots (VND). */
  escrowHeld: number;
  /** Bookings not yet finished or cancelled. */
  activeCount: number;
  /** Bookings with at least one collaborating photographer. */
  collabCount: number;
}

export interface AdminBookingsReport {
  summary: BookingSummary;
  rows: AdminBooking[];
}

// ── Storage & plans (Feature: cloud lưu trữ) ────────────────────────────────
export type StoragePlanTier = "free" | "pro" | "studio";

export interface AdminStorageRow {
  photographerId: string;
  name: string;
  avatar: string;
  plan: StoragePlanTier;
  usedBytes: number;
  quotaBytes: number;
  galleryCount: number;
  overQuota: boolean;
}

export interface StorageOverview {
  totalUsedBytes: number;
  overQuotaCount: number;
  planBreakdown: Record<StoragePlanTier, number>;
}

export interface StorageReport {
  overview: StorageOverview;
  rows: AdminStorageRow[];
}

// ── Ranks, commission & AI assistant (Features: achievements + AI) ──────────
export type RankId = "newbie" | "bronze" | "silver" | "gold" | "diamond";

export interface AdminQualityRow {
  photographerId: string;
  name: string;
  avatar: string;
  rank: RankId;
  completedSessions: number;
  /** 0–100. */
  fiveStarPct: number;
  /** 0–100. */
  cancelRate: number;
  /** Platform commission for this rank, 0–1. */
  commissionRate: number;
  assistantEnabled: boolean;
}

export interface QualityOverview {
  rankBreakdown: Record<RankId, number>;
  /** Average commission rate across photographers, 0–1. */
  avgCommission: number;
  aiEnabledCount: number;
}

export interface QualityReport {
  overview: QualityOverview;
  rows: AdminQualityRow[];
}

// ── Auth (UI phase — admins sign in on this app only) ─────────────────────────
/** The signed-in admin, as returned by the login endpoint and kept in session. */
export interface AdminSession {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

/** A demo admin login shown on the login page (UI phase only). */
export interface AdminDemoAccount {
  email: string;
  password: string;
}
