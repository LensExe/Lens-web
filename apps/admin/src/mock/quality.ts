import { avatar } from "@lens/ui";
import type { AdminQualityRow, RankId } from "@/types";

// Mock rank/commission + AI-assistant status per photographer. Imported ONLY by
// src/msw/handlers.ts. Commission per rank mirrors the portal's RANKS config
// (redefined here — admin is a separate app, no cross-app imports).
const av = (seed: string) => avatar(seed);

export const RANK_COMMISSION: Record<RankId, number> = {
  newbie: 0.1,
  bronze: 0.09,
  silver: 0.08,
  gold: 0.07,
  diamond: 0.06,
};

const row = (
  photographerId: string,
  name: string,
  seed: string,
  rank: RankId,
  completedSessions: number,
  fiveStarPct: number,
  cancelRate: number,
  assistantEnabled: boolean
): AdminQualityRow => ({
  photographerId,
  name,
  avatar: av(seed),
  rank,
  completedSessions,
  fiveStarPct,
  cancelRate,
  commissionRate: RANK_COMMISSION[rank],
  assistantEnabled,
});

export const mockQualityRows: AdminQualityRow[] = [
  row("u3", "Trần Quốc Bảo", "quocbao-av", "diamond", 132, 98, 1, true),
  row("u2", "Nguyễn Minh Anh", "minhanh-av", "gold", 68, 95, 3, true),
  row("u1", "Lý Gia Hân", "giahan-av", "silver", 27, 92, 4, true),
  row("u8", "Vũ Hoàng Lan", "hoanglan-av", "bronze", 14, 88, 6, false),
  row("u9", "Đỗ Khánh Vy", "khanhvy-av", "bronze", 11, 90, 5, true),
  row("u10", "Bùi Thanh Tùng", "thanhtung-av", "newbie", 4, 85, 8, false),
];
