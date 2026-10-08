import { catalogApi, photographerApi } from "@/services/backend";
import type { ApiPhotographer } from "@/types/photographers";
import type { PhotographerAchievements, RankId } from "@/types";

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => typeof value === "number" ? value : 0;

async function mapAchievements(profile: ApiPhotographer): Promise<PhotographerAchievements> {
  const [ranksResponse, badgesResponse] = await Promise.all([
    catalogApi.listPhotographerRanks(),
    catalogApi.listPhotographerBadges(),
  ]);
  const rank = record(profile.rank);
  const rankCode = text(rank.code) || "newbie";
  const rankCatalog = ranksResponse.items.map(record);
  const currentRank = rankCatalog.find((item) => item.code === rankCode);
  const badgeCatalog = badgesResponse.items.map((item) => ({
    id: text(record(item).code),
    name: text(record(item).name),
    description: text(record(item).description),
  }));
  const earned = Array.isArray(profile.badges)
    ? profile.badges.map((badge) => text(record(badge).code)).filter(Boolean)
    : [];
  return {
    photographerId: profile.id,
    rank: rankCode as RankId,
    rankName: text(currentRank?.name) || text(rank.name),
    badges: earned,
    badgeCatalog,
    commissionRate: number(currentRank?.commission_percent) / 100,
  };
}

export async function getAchievements(photographerId: string): Promise<PhotographerAchievements> {
  return mapAchievements(await photographerApi.getPhotographer(photographerId));
}

export async function getMyAchievements(): Promise<PhotographerAchievements> {
  return mapAchievements(await photographerApi.getMyPhotographerProfile() as ApiPhotographer);
}
