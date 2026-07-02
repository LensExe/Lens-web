import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  confirmReceipt,
  createBooking,
  getMyBookings,
  payBooking,
} from "@/services/bookings";
import { walletKeys } from "@/queries/useWallet";
import type { PaymentInput } from "@/types";

// Layer 2 — Query hooks.
export const bookingKeys = {
  mine: ["bookings", "mine"] as const,
};

// Pay / confirm / cancel move real money + Lens Xu, so refresh both ledgers too.
function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: walletKeys.summary });
  qc.invalidateQueries({ queryKey: walletKeys.transactions });
  qc.invalidateQueries({ queryKey: walletKeys.coinSummary });
  qc.invalidateQueries({ queryKey: walletKeys.coinTransactions });
}

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
      invalidateMoney(qc);
    },
  });
}

export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmReceipt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
      invalidateMoney(qc);
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
      invalidateMoney(qc);
    },
  });
}
