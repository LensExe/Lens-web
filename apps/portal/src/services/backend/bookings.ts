import { backendGet, backendPost } from "@/lib/backend-api";
import type { ApiItems, ApiObject, ApiPage } from "@/types/common";
import type {
  ApiBooking,
  BookingDisputeCommandDto,
  BookingCreateDto,
  BookingListQueryDto,
  BookingReasonDto,
} from "@/types/bookings";

export const listMyBookings = (query: BookingListQueryDto = {}) =>
  backendGet<ApiPage<ApiBooking>>("/bookings", query);

export const createBooking = (body: BookingCreateDto) =>
  backendPost<ApiBooking, BookingCreateDto>("/bookings", body);

export const getBooking = (bookingId: string) =>
  backendGet<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}`);

export const getCancellationPreview = (bookingId: string) =>
  backendGet<{
    booking_id: string;
    refundable_amount_vnd: number;
    refund_requires_admin_review: boolean;
  }>(`/bookings/${encodeURIComponent(bookingId)}/cancellation-preview`);

export const getBookingTimeline = (bookingId: string) =>
  backendGet<ApiItems<ApiObject>>(`/bookings/${encodeURIComponent(bookingId)}/timeline`);

export const acceptBooking = (bookingId: string) =>
  backendPost<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}/accept`);

export const cancelBooking = (bookingId: string, body: BookingReasonDto) =>
  backendPost<ApiBooking, BookingReasonDto>(`/bookings/${encodeURIComponent(bookingId)}/cancel`, body);

export const completeBooking = (bookingId: string) =>
  backendPost<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}/complete`);

export const confirmBookingReceipt = (bookingId: string) =>
  backendPost<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}/confirm-receipt`);

export const completeBookingShoot = (bookingId: string) =>
  backendPost<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}/complete-shoot`);

export const disputeBooking = (bookingId: string, body: BookingDisputeCommandDto) =>
  backendPost<ApiObject, BookingDisputeCommandDto>(`/bookings/${encodeURIComponent(bookingId)}/dispute`, body);

export const rejectBooking = (bookingId: string, body: BookingReasonDto) =>
  backendPost<ApiBooking, BookingReasonDto>(`/bookings/${encodeURIComponent(bookingId)}/reject`, body);

export const startBooking = (bookingId: string) =>
  backendPost<ApiBooking>(`/bookings/${encodeURIComponent(bookingId)}/start`);
