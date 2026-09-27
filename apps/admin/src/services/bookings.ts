import { api } from "@/lib/api";
import type { AdminBookingsReport } from "@/types";

// Layer 3 — Service / API.
export async function getBookings(): Promise<AdminBookingsReport> {
  return (await api.get<AdminBookingsReport>("/admin/bookings")).data;
}
