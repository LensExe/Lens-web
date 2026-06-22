import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/services/reports";

// Layer 2 — Query hooks.
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: getReports,
  });
}
