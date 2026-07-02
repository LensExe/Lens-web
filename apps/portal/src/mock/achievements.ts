import type { AchievementStats } from "@/types";

// Seed metrics per photographer. Rank + commission are DERIVED from these by the
// mock backend (lib/achievements). "me" sits just below the next rank so the
// progress bar is demonstrable. Imported ONLY by src/msw/handlers.ts.
// NOTE (giả định tạm): anti-fraud (min-value shoots, verified reviews) is backend.

export interface AchievementSeed {
  stats: AchievementStats;
  badges: string[];
}

export const seedAchievements: Record<string, AchievementSeed> = {
  me: {
    stats: { completedSessions: 27, fiveStarPct: 92, returningClients: 8, cancelRate: 4 },
    badges: ["fast-reply", "punctual", "loyal"],
  },
  p1: {
    stats: { completedSessions: 34, fiveStarPct: 95, returningClients: 10, cancelRate: 3 },
    badges: ["top-rated", "punctual"],
  },
  p2: {
    stats: { completedSessions: 132, fiveStarPct: 98, returningClients: 25, cancelRate: 1 },
    badges: ["wedding", "top-rated", "loyal", "punctual"],
  },
  p3: {
    stats: { completedSessions: 12, fiveStarPct: 88, returningClients: 4, cancelRate: 6 },
    badges: ["fast-reply"],
  },
  p12: {
    stats: { completedSessions: 96, fiveStarPct: 97, returningClients: 20, cancelRate: 2 },
    badges: ["wedding", "top-rated", "loyal"],
  },
  p16: {
    stats: { completedSessions: 5, fiveStarPct: 80, returningClients: 1, cancelRate: 8 },
    badges: [],
  },
};

// Deterministic fallback so every photographer has plausible, stable stats.
export function fallbackAchievement(id: string): AchievementSeed {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = ["fast-reply", "punctual", "top-rated", "yearbook", "loyal"];
  const badges = [pool[h % pool.length], pool[(h >> 3) % pool.length]].filter(
    (v, i, a) => a.indexOf(v) === i
  );
  return {
    stats: {
      completedSessions: 8 + (h % 70),
      fiveStarPct: 82 + (h % 16),
      returningClients: 2 + (h % 12),
      cancelRate: 2 + (h % 6),
    },
    badges,
  };
}
