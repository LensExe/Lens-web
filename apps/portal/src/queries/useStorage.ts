import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGallery,
  getMyGalleries,
  getStorageSummary,
  setStoragePlan,
  uploadPhotos,
} from "@/services/storage";
import type { StoragePlanTier } from "@/types";

// Layer 2 — Query hooks.
export const storageKeys = {
  summary: ["storage", "summary"] as const,
  galleries: ["storage", "galleries"] as const,
  gallery: (id: string) => ["gallery", id] as const,
};

export function useStorageSummary() {
  return useQuery({
    queryKey: storageKeys.summary,
    queryFn: getStorageSummary,
  });
}

export function useMyGalleries() {
  return useQuery({
    queryKey: storageKeys.galleries,
    queryFn: getMyGalleries,
  });
}

export function useGallery(bookingId: string) {
  return useQuery({
    queryKey: storageKeys.gallery(bookingId),
    queryFn: () => getGallery(bookingId),
    enabled: !!bookingId,
  });
}

export function useSetStoragePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: StoragePlanTier) => setStoragePlan(tier),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.summary });
      qc.invalidateQueries({ queryKey: storageKeys.galleries });
    },
  });
}

export function useUploadPhotos(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => uploadPhotos(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.gallery(bookingId) });
      qc.invalidateQueries({ queryKey: storageKeys.summary });
      qc.invalidateQueries({ queryKey: storageKeys.galleries });
    },
  });
}
