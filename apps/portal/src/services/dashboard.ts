import { api } from "@/lib/api";
import type { Booking, BookingStatus, Photographer } from "@/types";

// Layer 3 — Service / API for the signed-in photographer's dashboard. Thin HTTP
// calls; the mock backend (src/msw) owns the request/availability stores.

export async function getMyPhotographerProfile(): Promise<Photographer> {
  return (await api.get<Photographer>("/me/photographer")).data;
}

export async function updateMyPhotographerProfile(
  patch: Partial<Photographer>
): Promise<Photographer> {
  return (await api.patch<Photographer>("/me/photographer", patch)).data;
}

export async function getIncomingBookings(): Promise<Booking[]> {
  return (await api.get<Booking[]>("/me/bookings")).data;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking> {
  return (await api.patch<Booking>(`/me/bookings/${id}`, { status })).data;
}

export async function getMyAvailability(): Promise<string[]> {
  return (await api.get<string[]>("/me/availability")).data;
}

/** Toggle a single date on/off the photographer's free list. Returns the new set. */
export async function toggleAvailability(date: string): Promise<string[]> {
  return (await api.put<string[]>("/me/availability", { date })).data;
}
