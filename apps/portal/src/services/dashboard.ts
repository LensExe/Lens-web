import { api } from "@/lib/api";
import type {
  Booking,
  BookingStatus,
  EarningsSummary,
  Photographer,
  WorkSchedule,
} from "@/types";

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

export async function getMyEarnings(): Promise<EarningsSummary> {
  return (await api.get<EarningsSummary>("/me/earnings")).data;
}

export async function getMySchedule(): Promise<WorkSchedule> {
  return (await api.get<WorkSchedule>("/me/schedule")).data;
}

/** Replace the whole work schedule (weekly hours + busy dates). */
export async function saveMySchedule(schedule: WorkSchedule): Promise<WorkSchedule> {
  return (await api.put<WorkSchedule>("/me/schedule", schedule)).data;
}
