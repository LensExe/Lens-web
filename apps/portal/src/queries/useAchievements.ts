import { useQuery } from "@tanstack/react-query";
import { getAchievements, getMyAchievements } from "@/services/achievements";

// Layer 2 — Query hooks.
export const achievementKeys = {
  detail: (id: string) => ["achievements", id] as const,
  mine: ["achievements", "mine"] as const,
};

export function useAchievements(photographerId: string) {
  return useQuery({
    queryKey: achievementKeys.detail(photographerId),
    queryFn: () => getAchievements(photographerId),
    enabled: !!photographerId,
  });
}

export function useMyAchievements() {
  return useQuery({
    queryKey: achievementKeys.mine,
    queryFn: getMyAchievements,
  });
}
