import { api } from "@/lib/api";
import type { Booking, BookingInput, PaymentInput } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) owns the
// in-memory store + sorting and answers these in the UI phase.

export async function getMyBookings(): Promise<Booking[]> {
  return (await api.get<Booking[]>("/bookings")).data;
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  return (await api.post<Booking>("/bookings", input)).data;
}

/** Client pays in full → platform holds the money in escrow (status "held"). */
export async function payBooking(
  id: string,
  input: PaymentInput
): Promise<Booking> {
  return (await api.post<Booking>(`/bookings/${id}/pay`, input)).data;
}

/** Client confirms delivery → escrow releases to the photographer ("released"). */
export async function confirmReceipt(id: string): Promise<Booking> {
  return (await api.post<Booking>(`/bookings/${id}/confirm-receipt`, {})).data;
}

/** Client cancels a held booking → escrow refunds in full ("cancelled"). */
export async function cancelBooking(id: string): Promise<Booking> {
  return (await api.post<Booking>(`/bookings/${id}/cancel`, {})).data;
}
