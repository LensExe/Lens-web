import { backendDelete, backendGet, backendPost } from "@/lib/backend-api";
import type { ApiObject } from "@/types/common";
import type { MediaAddGalleryItemDto, MediaCompleteDto, MediaUploadDto } from "@/types/media";

export const requestMediaUpload = (body: MediaUploadDto) =>
  backendPost<ApiObject, MediaUploadDto>("/media/upload-url", body);

export const completeMediaUpload = (body: MediaCompleteDto) =>
  backendPost<ApiObject, MediaCompleteDto>("/media/complete-upload", body);

export const getMedia = (mediaId: string) =>
  backendGet<ApiObject>(`/media/${encodeURIComponent(mediaId)}`);

export const deleteMedia = (mediaId: string) =>
  backendDelete<{ deleted: boolean }>(`/media/${encodeURIComponent(mediaId)}`);

export const getBookingGallery = (bookingId: string) =>
  backendGet<ApiObject>(`/bookings/${encodeURIComponent(bookingId)}/gallery`);

export const getBookingGalleryDownload = (bookingId: string) =>
  backendGet<ApiObject>(`/bookings/${encodeURIComponent(bookingId)}/gallery/download`);

export const addBookingGalleryItem = (bookingId: string, body: MediaAddGalleryItemDto) =>
  backendPost<ApiObject, MediaAddGalleryItemDto>(`/bookings/${encodeURIComponent(bookingId)}/gallery/items`, body);

export const publishBookingGallery = (bookingId: string) =>
  backendPost<ApiObject>(`/bookings/${encodeURIComponent(bookingId)}/gallery/publish`);

export const createBookingGallery = (bookingId: string) =>
  backendPost<ApiObject>(`/bookings/${encodeURIComponent(bookingId)}/gallery`);
