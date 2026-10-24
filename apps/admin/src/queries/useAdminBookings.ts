import { useQuery } from "@tanstack/react-query";
import { getAdminBookingDetail, getAdminBookingTimeline, getBookings } from "@/services/bookings";

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

export function useAdminBookingDetail(id: string) {
  return useQuery({
    queryKey: [...bookingKeys.all, "detail", id],
    queryFn: () => getAdminBookingDetail(id),
    enabled: Boolean(id),
  });
}

export function useAdminBookingTimeline(id: string) {
  return useQuery({
    queryKey: [...bookingKeys.all, "timeline", id],
    queryFn: () => getAdminBookingTimeline(id),
    enabled: Boolean(id),
  });
}
