import type { RankId } from "@/types";

// Career ladder + specialty badges (UI phase). Ranks are time/volume based and
// ordered; badges are flat (ngang hàng). NOTE (giả định tạm): thresholds, perks
// and anti-fraud (min-value shoots, verified-client reviews only) are finalized
// with the backend.

export interface RankTier {
  id: RankId;
  name: string;
  /** Completed shoots required to reach this rank. */
  minSessions: number;
  /** Platform commission at this rank (lower = better perk). */
  commissionRate: number;
  /** Tinted pill style for the rank badge. */
  className: string;
}

export const RANKS: RankTier[] = [
  {
    id: "newbie",
    name: "Tân binh",
    minSessions: 0,
    commissionRate: 0.1,
    className: "bg-muted text-muted-foreground",
  },
  {
    id: "bronze",
    name: "Thợ Đồng",
    minSessions: 10,
    commissionRate: 0.09,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  },
  {
    id: "silver",
    name: "Thợ Bạc",
    minSessions: 30,
    commissionRate: 0.08,
    className: "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
  },
  {
    id: "gold",
    name: "Thợ Vàng",
    minSessions: 60,
    commissionRate: 0.07,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
  },
  {
    id: "diamond",
    name: "Thợ Kim Cương",
    minSessions: 120,
    commissionRate: 0.05,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
];

export const rankById = (id: RankId): RankTier =>
  RANKS.find((r) => r.id === id) ?? RANKS[0];

/** The rank a photographer holds given their completed-session count. */
export function rankForSessions(sessions: number): RankTier {
  let tier = RANKS[0];
  for (const r of RANKS) if (sessions >= r.minSessions) tier = r;
  return tier;
}

/** Progress toward the next rank — for the "còn X buổi nữa" bar. */
export function rankProgress(sessions: number): {
  current: RankTier;
  next: RankTier | null;
  remaining: number;
  pct: number;
} {
  const current = rankForSessions(sessions);
  const idx = RANKS.findIndex((r) => r.id === current.id);
  const next = RANKS[idx + 1] ?? null;
  if (!next) return { current, next: null, remaining: 0, pct: 100 };
  const span = next.minSessions - current.minSessions;
  const done = sessions - current.minSessions;
  const pct = Math.min(100, Math.max(0, Math.round((done / span) * 100)));
  return { current, next, remaining: next.minSessions - sessions, pct };
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
}

/** Flat specialty badges (not tiered). */
export const BADGES: BadgeDef[] = [
  { id: "yearbook", name: "Chuyên gia kỷ yếu", description: "Nhiều buổi chụp kỷ yếu được đánh giá cao" },
  { id: "wedding", name: "Chuyên gia ảnh cưới", description: "Kinh nghiệm ảnh cưới dày dạn" },
  { id: "fast-reply", name: "Phản hồi nhanh", description: "Trả lời khách dưới 5 phút" },
  { id: "punctual", name: "Đúng giờ tuyệt đối", description: "Luôn có mặt đúng giờ hẹn" },
  { id: "top-rated", name: "Đánh giá xuất sắc", description: "Tỷ lệ đánh giá 5 sao rất cao" },
  { id: "loyal", name: "Khách quay lại", description: "Nhiều khách hàng đặt lại lần nữa" },
];

export const badgeById = (id: string): BadgeDef | undefined =>
  BADGES.find((b) => b.id === id);
