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
  portfolioCount: number;
  bio: string;
  /** ISO date string the application was submitted. */
  submittedAt: string;
  status: ApprovalStatus;
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
}

export interface ActivityItem {
  id: string;
  type: "signup" | "booking" | "application" | "report";
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
  | "pending"
  | "confirmed"
  | "held"
  | "released"
  | "cancelled";

export interface AdminCollaborator {
  name: string;
  /** Payout share 0–100. */
  sharePct: number;
  status: "invited" | "accepted" | "declined";
}

export interface AdminBooking {
  id: string;
  clientName: string;
  photographerName: string;
  collaborators?: AdminCollaborator[];
  style: string;
  /** ISO date string. */
  date: string;
  /** VND. */
  price: number;
  status: EscrowStatus;
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
