import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from "@/services/stats";

export const queueKey = ["admin", "queue"] as const;

export function useOverviewStats() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getOverviewStats,
  });
}
