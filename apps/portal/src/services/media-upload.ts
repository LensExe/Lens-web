import { mediaApi } from "@/services/backend";
import type { ApiObject } from "@/types/common";
import type { MediaUploadDto } from "@/types/media";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set<MediaUploadDto["content_type"]>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForReady(mediaId: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const media = await mediaApi.getMedia(mediaId);
    const status = media.status;
    if (status === "ready") return;
    if (status === "failed" || status === "deleted") {
      throw new Error("Backend không xử lý được ảnh đã tải lên.");
    }
    await pause(1500);
  }
  throw new Error("Ảnh đang được xử lý. Vui lòng tải lại trang sau ít phút.");
}

/** Upload an image through the backend's signed URL and wait for processing. */
export async function uploadImageFile(
  file: File,
  visibility: MediaUploadDto["visibility"],
): Promise<string> {
  if (!ALLOWED_CONTENT_TYPES.has(file.type as MediaUploadDto["content_type"])) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.");
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Kích thước ảnh phải từ 1 byte đến 100 MB.");
  }

  const reservation = await mediaApi.requestMediaUpload({
    content_type: file.type as MediaUploadDto["content_type"],
    file_size: file.size,
    visibility,
  });
  const media = asRecord(reservation.media);
  const mediaId = typeof media.id === "string" ? media.id : "";
  const uploadUrl = typeof reservation.upload_url === "string" ? reservation.upload_url : "";
  if (!mediaId || !uploadUrl) throw new Error("Backend không trả về thông tin upload hợp lệ.");

  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploaded.ok) throw new Error(`Không thể tải ảnh lên kho lưu trữ (${uploaded.status}).`);

  await mediaApi.completeMediaUpload({ media_id: mediaId });
  await waitForReady(mediaId);
  return mediaId;
}

export function apiRecord(value: unknown): ApiObject {
  return asRecord(value) as ApiObject;
}

export function isNotFoundOrForbidden(error: unknown): boolean {
  const status = asRecord(asRecord(error).response).status;
  return status === 403 || status === 404;
}
