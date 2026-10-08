import type { BookingStatus } from "@/types";
import type { BookingStatus as BackendBookingStatus } from "@/types/bookings";

/** The six visual steps of the booking lifecycle. */
export const STEPS: { key: string; title: string; desc: string }[] = [
  { key: "deposit", title: "Đặt cọc", desc: "Thanh toán tiền cọc giữ lịch" },
  { key: "confirmed", title: "Xác nhận", desc: "Đặt cọc thành công, lịch được xác nhận" },
  { key: "shooting", title: "Chụp ảnh", desc: "Buổi chụp đang diễn ra" },
  { key: "payment", title: "Thanh toán", desc: "Thanh toán phần còn lại" },
  { key: "delivery", title: "Giao ảnh", desc: "Nhiếp ảnh gia giao ảnh cho khách" },
  { key: "completed", title: "Hoàn thành", desc: "Khách đã xác nhận nhận ảnh" },
];

/**
 * Compute which step (0-based index) the booking is currently at.
 *
 * Mapping from UI + backend statuses:
 *   awaiting_deposit           → step 0 (Đặt cọc)
 *   pending                    → step 1 (Đặt cọc đã thanh toán, chờ xác nhận)
 *   confirmed                  → step 1 (Xác nhận)
 *   held + backend accepted    → step 2 (Chụp ảnh — ready to shoot)
 *   held + backend in_progress → step 2 (Chụp ảnh — shoot in progress)
 *   held + backend shot        → step 3 (Thanh toán — shot done, pay remaining)
 *   released / completed       → step 5 (Hoàn thành)
 */
export function resolveStep(status: BookingStatus, backendStatus?: BackendBookingStatus): number {
  switch (status) {
    case "pending":
      return 1; // deposit paid, waiting for photographer confirmation
    case "awaiting_deposit":
      return 0;
    case "confirmed":
      return 1;
    case "held": {
      // Distinguish sub-steps within "held" using the backend status
      if (backendStatus === "in_progress") return 2;
      if (backendStatus === "shot") return 3;
      // accepted → ready to shoot
      return 2;
    }
    case "released":
      return 5;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

/** Returns the 1-based step number for the progress badge (e.g. "Bước 3/6"). */
export function timelineStepNumber(
  status: BookingStatus,
  backendStatus?: BackendBookingStatus,
): number {
  if (status === "cancelled") return 0;
  return resolveStep(status, backendStatus) + 1;
}
