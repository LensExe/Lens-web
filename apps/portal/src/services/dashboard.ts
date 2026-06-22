import { delay } from "@lens/ui";
import { incomingBookings, myPhotographer } from "@/mock/dashboard";
import type { Booking, BookingStatus, Photographer } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API for the signed-in photographer's dashboard.
// In-memory stores (UI phase) so accepting/declining a request and toggling
// availability persist within the session. A full reload resets them.
let requestStore: Booking[] = [...incomingBookings];
let availableDates: string[] = [...myPhotographer.availableDates];

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export async function getMyPhotographerProfile(): Promise<Photographer> {
  await delay();
  return { ...myPhotographer, availableDates: [...availableDates].sort() };
  // LATER: return (await api.get<Photographer>("/me/photographer")).data;
}

export async function getIncomingBookings(): Promise<Booking[]> {
  await delay();
  const today = todayISO();
  // Upcoming first (soonest → latest), then past (most recent → oldest).
  return [...requestStore].sort((a, b) => {
    const af = a.date >= today;
    const bf = b.date >= today;
    if (af !== bf) return af ? -1 : 1;
    return af ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
  // LATER: return (await api.get<Booking[]>("/me/bookings")).data;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking> {
  await delay();
  requestStore = requestStore.map((b) => (b.id === id ? { ...b, status } : b));
  const updated = requestStore.find((b) => b.id === id);
  if (!updated) throw new Error("Không tìm thấy yêu cầu đặt lịch");
  return updated;
  // LATER: return (await api.patch<Booking>(`/me/bookings/${id}`, { status })).data;
}

export async function getMyAvailability(): Promise<string[]> {
  await delay();
  return [...availableDates].sort();
  // LATER: return (await api.get<string[]>("/me/availability")).data;
}

/** Toggle a single date on/off the photographer's free list. Returns the new set. */
export async function toggleAvailability(date: string): Promise<string[]> {
  await delay();
  availableDates = availableDates.includes(date)
    ? availableDates.filter((d) => d !== date)
    : [...availableDates, date];
  return [...availableDates].sort();
  // LATER: return (await api.put<string[]>("/me/availability", { date })).data;
}
