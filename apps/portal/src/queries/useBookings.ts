import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  confirmReceipt,
  createBooking,
  getMyBookings,
  payBooking,
} from "@/services/bookings";
import type { PaymentInput } from "@/types";

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

export function usePayBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentInput) => payBooking(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}

export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmReceipt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
    },
  });
}
