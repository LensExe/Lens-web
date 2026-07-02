import { avatar } from "@lens/ui";
import type { AdminStorageRow } from "@/types";

// Mock storage usage per photographer. Imported ONLY by src/msw/handlers.ts.
const av = (seed: string) => avatar(seed);
const GB = 1024 ** 3;

// Quota per plan (total, for the whole account in this admin view).
export const PLAN_QUOTA_BYTES = {
  free: 2 * GB,
  pro: 20 * GB,
  studio: 100 * GB,
} as const;

const row = (
  photographerId: string,
  name: string,
  seed: string,
  plan: keyof typeof PLAN_QUOTA_BYTES,
  usedGb: number,
  galleryCount: number
): AdminStorageRow => {
  const usedBytes = Math.round(usedGb * GB);
  const quotaBytes = PLAN_QUOTA_BYTES[plan];
  return {
    photographerId,
    name,
    avatar: av(seed),
    plan,
    usedBytes,
    quotaBytes,
    galleryCount,
    overQuota: usedBytes > quotaBytes,
  };
};

export const mockStorageRows: AdminStorageRow[] = [
  row("u1", "Lý Gia Hân", "giahan-av", "free", 2.4, 6), // over quota
  row("u2", "Nguyễn Minh Anh", "minhanh-av", "pro", 12.5, 18),
  row("u3", "Trần Quốc Bảo", "quocbao-av", "studio", 64, 41),
  row("u8", "Vũ Hoàng Lan", "hoanglan-av", "free", 1.1, 3),
  row("u9", "Đỗ Khánh Vy", "khanhvy-av", "pro", 21.2, 24), // over quota
  row("u10", "Bùi Thanh Tùng", "thanhtung-av", "free", 0.6, 2),
];
