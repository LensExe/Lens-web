import { useQuery } from "@tanstack/react-query";
import { getStorageReport } from "@/services/storage";

export const storageKey = ["admin", "storage"] as const;

export function useStorageReport() {
  return useQuery({ queryKey: storageKey, queryFn: getStorageReport });
}
