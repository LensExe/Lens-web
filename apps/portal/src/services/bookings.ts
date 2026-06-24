import { api } from "@/lib/api";
import type { Booking, BookingInput } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) owns the
// in-memory store + sorting and answers these in the UI phase.

export async function getMyBookings(): Promise<Booking[]> {
  return (await api.get<Booking[]>("/bookings")).data;
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  return (await api.post<Booking>("/bookings", input)).data;
}
