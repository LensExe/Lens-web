import { bookingApi } from "@/services/backend";
import { getMyBookings } from "@/services/bookings";
import {
  getMyPhotographerProfile,
  updateMyPhotographerProfile,
} from "@/services/photographers";
import type { Booking, BookingStatus, EarningsSummary } from "@/types";

export { getMyPhotographerProfile, updateMyPhotographerProfile };

export const getIncomingBookings = getMyBookings;

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking> {
  switch (status) {
    case "confirmed":
      await bookingApi.acceptBooking(bookingId);
      break;
    case "cancelled":
      await bookingApi.rejectBooking(bookingId, { reason: "Nhiếp ảnh gia từ chối yêu cầu đặt lịch." });
      break;
    case "held":
      await bookingApi.startBooking(bookingId);
      break;
    default:
      throw new Error(`Không có thao tác backend tương ứng với trạng thái booking “${status}”.`);
  }
  const bookings = await getMyBookings();
  const updated = bookings.find((booking) => booking.id === bookingId);
  if (!updated) throw new Error("Không tải lại được booking sau khi cập nhật.");
  return updated;
}

export async function completeShoot(bookingId: string): Promise<Booking> {
  await bookingApi.completeBookingShoot(bookingId);
  const bookings = await getMyBookings();
  const updated = bookings.find((booking) => booking.id === bookingId);
  if (!updated) throw new Error("Không tải lại được booking sau khi cập nhật.");
  return updated;
}

/** The backend has no monthly earnings/report endpoint yet. */
export async function getMyEarnings(): Promise<EarningsSummary | null> {
  return null;
}
