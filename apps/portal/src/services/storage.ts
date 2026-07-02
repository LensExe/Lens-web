import { api } from "@/lib/api";
import type { ShootGallery, StoragePlanTier, StorageSummary } from "@/types";

// Layer 3 — Service / API.

export async function getStorageSummary(): Promise<StorageSummary> {
  return (await api.get<StorageSummary>("/me/storage")).data;
}

export async function getMyGalleries(): Promise<ShootGallery[]> {
  return (await api.get<ShootGallery[]>("/me/galleries")).data;
}

export async function setStoragePlan(
  tier: StoragePlanTier
): Promise<StorageSummary> {
  return (await api.post<StorageSummary>("/me/storage/plan", { tier })).data;
}

export async function getGallery(
  bookingId: string
): Promise<ShootGallery | null> {
  return (await api.get<ShootGallery | null>(`/bookings/${bookingId}/gallery`))
    .data;
}

export async function uploadPhotos(bookingId: string): Promise<ShootGallery> {
  return (
    await api.post<ShootGallery>(`/me/bookings/${bookingId}/gallery`, {})
  ).data;
}
