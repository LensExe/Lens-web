import { mediaApi } from "@/services/backend";
import { getMyBookings } from "@/services/bookings";
import { apiRecord, isNotFoundOrForbidden, uploadImageFile } from "@/services/media-upload";
import type { ApiObject } from "@/types/common";
import type { Booking, GalleryPhoto, ShootGallery } from "@/types";

const string = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => typeof value === "number" ? value : Number(value ?? 0) || 0;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function makeGallery(booking: Booking, payload: ApiObject, downloadPayload?: ApiObject): ShootGallery {
  const downloadItems = new Map(
    array(downloadPayload?.items).map((item) => {
      const row = apiRecord(item);
      return [string(row.media_id ?? row.id), string(row.download_url)] as const;
    }),
  );
  const photos: GalleryPhoto[] = array(payload.items).map((item, index) => {
    const row = apiRecord(item);
    const id = string(row.media_id ?? row.id);
    const originalUrl = downloadItems.get(id) || undefined;
    return {
      id: id || `photo-${index}`,
      url: string(row.thumbnail_url) || originalUrl || "",
      originalUrl,
      name: `Ảnh ${index + 1}`,
      sizeBytes: number(row.file_size),
    };
  }).filter((photo) => photo.url.length > 0);

  return {
    bookingId: booking.id,
    photographerId: booking.photographerId,
    clientName: booking.clientName,
    style: booking.style,
    photos,
    sizeBytes: photos.reduce((total, photo) => total + photo.sizeBytes, 0),
    publishedAt: string(payload.published_at) || null,
  };
}

async function galleryForBooking(booking: Booking): Promise<ShootGallery | null> {
  try {
    const payload = await mediaApi.getBookingGallery(booking.id);
    const download = await mediaApi.getBookingGalleryDownload(booking.id).catch(() => undefined);
    return makeGallery(booking, payload, download);
  } catch (error) {
    if (isNotFoundOrForbidden(error)) return null;
    throw error;
  }
}

export async function getMyGalleries(): Promise<ShootGallery[]> {
  const bookings = await getMyBookings();
  const galleries = await Promise.all(bookings.map(galleryForBooking));
  return galleries.filter((gallery): gallery is ShootGallery => !!gallery && gallery.photos.length > 0);
}

export async function getGallery(bookingId: string): Promise<ShootGallery | null> {
  const [bookings, payload] = await Promise.all([
    getMyBookings(),
    mediaApi.getBookingGallery(bookingId).catch((error: unknown) => {
      if (isNotFoundOrForbidden(error)) return null;
      throw error;
    }),
  ]);
  if (!payload) return null;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) return null;
  const download = await mediaApi.getBookingGalleryDownload(bookingId).catch(() => undefined);
  return makeGallery(booking, payload, download);
}

export async function uploadPhotos(bookingId: string, files: File[]): Promise<ShootGallery | null> {
  if (files.length === 0) return getGallery(bookingId);
  await mediaApi.createBookingGallery(bookingId);
  for (const file of files) {
    const mediaId = await uploadImageFile(file, "private");
    await mediaApi.addBookingGalleryItem(bookingId, { media_id: mediaId });
  }
  return getGallery(bookingId);
}

export async function publishGallery(bookingId: string): Promise<ShootGallery | null> {
  await mediaApi.publishBookingGallery(bookingId);
  return getGallery(bookingId);
}
