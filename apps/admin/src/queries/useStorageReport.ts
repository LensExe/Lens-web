import { useQuery } from "@tanstack/react-query";
import { getStorageReport } from "@/services/storage";

// Layer 2 — Query hooks.
export const storageKeys = {
  report: ["admin-storage"] as const,
};

export function useStorageReport() {
  return useQuery({
    queryKey: storageKeys.report,
    queryFn: getStorageReport,
  });
}
