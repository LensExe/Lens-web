import { useQuery } from "@tanstack/react-query";
import { getBookings } from "@/services/bookings";

// Layer 2 — Query hooks.
export const bookingKeys = {
  all: ["admin-bookings"] as const,
};

export function useAdminBookings() {
  return useQuery({
    queryKey: bookingKeys.all,
    queryFn: getBookings,
  });
}
