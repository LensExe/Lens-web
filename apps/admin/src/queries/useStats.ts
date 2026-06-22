import { useQuery } from "@tanstack/react-query";
import { getOverviewStats, getRecentActivity } from "@/services/stats";

// Layer 2 — Query hooks.
export function useOverviewStats() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getOverviewStats,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["stats", "activity"],
    queryFn: getRecentActivity,
  });
}
