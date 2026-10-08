import type { UUID } from "./common";

/** Media upload and gallery DTOs. */
export interface MediaUploadDto {
  content_type: "image/jpeg" | "image/png" | "image/webp";
  file_size: number;
  visibility?: "public" | "private";
}

export interface MediaCompleteDto { media_id: UUID }
export interface MediaAddGalleryItemDto { media_id: UUID }
