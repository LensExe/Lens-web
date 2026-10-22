import type { ISODateTime, UUID } from "./common";

/** Media upload and gallery DTOs. */
export interface MediaUploadDto {
  content_type: "image/jpeg" | "image/png" | "image/webp";
  file_size: number;
  visibility?: "public" | "private";
}

export interface MediaCompleteDto { media_id: UUID }
export interface MediaAddGalleryItemDto { media_id: UUID }

export interface ApiMedia {
  id: UUID;
  status: "pending" | "uploaded" | "processing" | "ready" | "failed" | "deleted";
  content_type: string;
  file_size: number;
  visibility: "public" | "private";
  thumbnail_url?: string | null;
  preview_url?: string | null;
  download_url?: string | null;
  expires_in?: number | null;
}

export interface ApiDeliveryGalleryItem {
  id: UUID;
  media_id: UUID;
  file_size: number;
  content_type: string;
  thumbnail_url?: string;
  download_url?: string;
  width?: number | null;
  height?: number | null;
}

export interface ApiDeliveryGallery {
  id: UUID;
  booking_id: UUID;
  title?: string;
  media_ids: UUID[];
  published_at: ISODateTime | null;
  expires_in: number | null;
  items: ApiDeliveryGalleryItem[];
  [key: string]: unknown;
}
