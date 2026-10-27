import { bookingApi, moderationApi } from "@/services/backend";
import { apiRecord, uploadImageFile } from "@/services/media-upload";
import type { ApiObject } from "@/types/common";
import type { BookingDisputeCommandDto, BookingReportCategory } from "@/types/bookings";
import type { BookingReportReceipt } from "@/types/moderation";

const PAGE_SIZE = 100;
const MAX_EVIDENCE_COUNT = 5;
const MAX_EVIDENCE_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const string = (value: unknown) => typeof value === "string" ? value : "";

function toReceipt(value: unknown): BookingReportReceipt {
  const row = apiRecord(value);
  return {
    id: string(row.id),
    target_type: "booking",
    target_id: string(row.target_id),
    booking_issue_type: typeof row.booking_issue_type === "string"
      ? row.booking_issue_type as BookingReportCategory
      : null,
    reason: string(row.reason),
    status: string(row.status) as BookingReportReceipt["status"],
    created_at: string(row.created_at),
    resolution: typeof row.resolution === "string" ? row.resolution : null,
  };
}

/** Load the newest customer report attached to a booking, if any. */
export async function getLatestBookingReport(bookingId: string): Promise<BookingReportReceipt | null> {
  let offset = 0;

  while (true) {
    const page = await moderationApi.listMyReports({ limit: PAGE_SIZE, offset });
    const match = page.items.find((item) => {
      const row = item as ApiObject;
      return row.target_type === "booking" && row.target_id === bookingId;
    });
    if (match) return toReceipt(match);
    if (page.items.length === 0 || offset + page.items.length >= page.total) break;
    offset += page.items.length;
  }

  return null;
}

/** Upload private evidence first, then create the booking dispute. */
export async function createBookingReport(input: {
  bookingId: string;
  category: BookingReportCategory;
  reason: string;
  evidence: File[];
}): Promise<BookingReportReceipt> {
  if (input.evidence.length > MAX_EVIDENCE_COUNT) {
    throw new Error("Bạn chỉ có thể đính kèm tối đa 5 ảnh.");
  }

  const evidenceMediaIds: string[] = [];
  for (const file of input.evidence) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP làm bằng chứng.");
    }
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) {
      throw new Error("Mỗi ảnh bằng chứng phải từ 1 byte đến 12 MB.");
    }
    evidenceMediaIds.push(await uploadImageFile(file, "private"));
  }

  const body: BookingDisputeCommandDto = {
    booking_issue_type: input.category,
    reason: input.reason.trim(),
    evidence_media_ids: evidenceMediaIds,
  };
  return toReceipt(await bookingApi.disputeBooking(input.bookingId, body));
}
