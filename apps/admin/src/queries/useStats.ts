import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from "@/services/stats";
import { adminApi } from "@/services/backend";

export const queueKey = ["admin", "queue"] as const;

export function useOverviewStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getOverviewStats,
  });
}

export function useAdminQueue() {
  return useQuery({
    queryKey: queueKey,
    queryFn: adminApi.getQueue,
  });
}
