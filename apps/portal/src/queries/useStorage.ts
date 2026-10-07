import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGallery, getMyGalleries, publishGallery, uploadPhotos } from "@/services/storage";

export const storageKeys = {
  galleries: ["storage", "galleries"] as const,
  gallery: (id: string) => ["gallery", id] as const,
};

export function useMyGalleries() {
  return useQuery({ queryKey: storageKeys.galleries, queryFn: getMyGalleries });
}

export function useGallery(bookingId: string) {
  return useQuery({
    queryKey: storageKeys.gallery(bookingId),
    queryFn: () => getGallery(bookingId),
    enabled: !!bookingId,
  });
}

function useRefreshGallery(bookingId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: storageKeys.gallery(bookingId) });
    qc.invalidateQueries({ queryKey: storageKeys.galleries });
    qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
    qc.invalidateQueries({ queryKey: ["dashboard", "incoming"] });
  };
}

export function useUploadPhotos(bookingId: string) {
  const refresh = useRefreshGallery(bookingId);
  return useMutation({
    mutationFn: (files: File[]) => uploadPhotos(bookingId, files),
    onSuccess: refresh,
  });
}

export function usePublishGallery(bookingId: string) {
  const refresh = useRefreshGallery(bookingId);
  return useMutation({
    mutationFn: () => publishGallery(bookingId),
    onSuccess: refresh,
  });
}
