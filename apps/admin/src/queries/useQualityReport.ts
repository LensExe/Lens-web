import { useQuery } from "@tanstack/react-query";
import { getQualityReport } from "@/services/quality";

// Layer 2 — Query hooks.
export const qualityKeys = {
  report: ["admin-quality"] as const,
};

export function useQualityReport() {
  return useQuery({
    queryKey: qualityKeys.report,
    queryFn: getQualityReport,
  });
}
