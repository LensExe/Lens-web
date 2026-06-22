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
