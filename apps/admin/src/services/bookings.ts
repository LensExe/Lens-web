import { api } from "@/lib/api";
import type { AdminBooking } from "@/types";

// Layer 3 — Service / API.
export async function getBookings(): Promise<AdminBooking[]> {
  return (await api.get<AdminBooking[]>("/admin/bookings")).data;
}
