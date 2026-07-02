import type { StoragePlanTier } from "@/types";

// Cloud storage plans (UI phase). NOTE (giả định tạm): quotas/retention/pricing
// and the real storage-cost model (S3/GCS) are finalized with the backend. T&C
// intentionally says "lưu trữ dài hạn khi còn duy trì gói" — never "vĩnh viễn".

export const GB = 1024 ** 3;

export interface StoragePlanDef {
  id: StoragePlanTier;
  name: string;
  quotaPerShootGB: number;
  /** Days photos are retained; null = long-term while the plan is active. */
  retentionDays: number | null;
  priceLabel: string;
  highlight: string;
}

export const STORAGE_PLANS: StoragePlanDef[] = [
  {
    id: "free",
    name: "Free",
    quotaPerShootGB: 2,
    retentionDays: 30,
    priceLabel: "Miễn phí",
    highlight: "2GB mỗi buổi · lưu 30 ngày",
  },
  {
    id: "pro",
    name: "Pro",
    quotaPerShootGB: 10,
    retentionDays: 365,
    priceLabel: "99.000 ₫/tháng",
    highlight: "10GB mỗi buổi · lưu 1 năm",
  },
  {
    id: "studio",
    name: "Studio",
    quotaPerShootGB: 30,
    retentionDays: null,
    priceLabel: "249.000 ₫/tháng",
    highlight: "30GB mỗi buổi · lưu trữ dài hạn khi còn duy trì gói",
  },
];

export const planById = (id: StoragePlanTier): StoragePlanDef =>
  STORAGE_PLANS.find((p) => p.id === id) ?? STORAGE_PLANS[0];

/** Format bytes as a friendly VN string, e.g. "1,4 GB" / "820 MB". */
export function formatBytes(bytes: number): string {
  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(1).replace(".", ",")} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${Math.round(mb)} MB`;
}

/** Whole days from now until an ISO datetime (negative if past). */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export type ExpiryLevel = "none" | "safe" | "warn" | "critical" | "expired";

/** Warning level for a gallery's expiry — drives the 7/3/1-day banners. */
export function expiryLevel(expiresAt: string | null): ExpiryLevel {
  if (!expiresAt) return "none";
  const d = daysUntil(expiresAt);
  if (d <= 0) return "expired";
  if (d <= 1) return "critical";
  if (d <= 7) return "warn";
  return "safe";
}
