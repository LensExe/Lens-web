import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBooking, getMyBookings } from "@/services/bookings";

// Layer 2 — Query hooks.
export const bookingKeys = {
  mine: ["bookings", "mine"] as const,
};

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine,
    queryFn: getMyBookings,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}
