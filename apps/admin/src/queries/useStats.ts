import { useQuery } from "@tanstack/react-query";
import { getOverviewStats, getQueue, getRecentActivity } from "@/services/stats";

/** Invalidated by every mutation that adds or clears an admin task. */
export const queueKey = ["queue"] as const;

export function useAdminQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: getQueue,
  });
}

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
