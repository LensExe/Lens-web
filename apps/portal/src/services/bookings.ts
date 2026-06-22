import { delay } from "@lens/ui";
import { seedBookings } from "@/mock/bookings";
import type { Booking, BookingInput } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// In-memory store (UI phase) seeded from mock. Resets on full reload —
// good enough to make "book → see it in my bookings" feel real this session.
let store: Booking[] = [...seedBookings];

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Layer 3 — Service / API.
export async function getMyBookings(): Promise<Booking[]> {
  await delay();
  const today = todayISO();
  // Upcoming first (soonest → latest), then past (most recent → oldest).
  return [...store].sort((a, b) => {
    const af = a.date >= today;
    const bf = b.date >= today;
    if (af !== bf) return af ? -1 : 1;
    return af ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
  // LATER: return (await api.get<Booking[]>("/bookings")).data;
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  await delay();
  const booking: Booking = {
    id: `bk-${Date.now()}`,
    clientId: "me",
    clientName: input.contactName,
    photographerId: input.photographerId,
    photographerName: input.photographerName,
    style: input.style,
    date: input.date,
    location: input.location,
    price: input.price,
    status: "pending",
  };
  store = [booking, ...store]; // CURRENT: persist in memory
  return booking;
  // LATER: return (await api.post<Booking>("/bookings", input)).data;
}
