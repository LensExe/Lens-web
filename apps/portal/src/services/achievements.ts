import { api } from "@/lib/api";
import type { PhotographerAchievements } from "@/types";

// Layer 3 — Service / API.

export async function getAchievements(
  photographerId: string
): Promise<PhotographerAchievements> {
  return (
    await api.get<PhotographerAchievements>(
      `/photographers/${photographerId}/achievements`
    )
  ).data;
}

export async function getMyAchievements(): Promise<PhotographerAchievements> {
  return (await api.get<PhotographerAchievements>("/me/achievements")).data;
}
