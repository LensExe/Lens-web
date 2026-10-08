import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  confirmReceipt,
  createBooking,
  getPaymentQr,
  getMyBookings,
  getPaymentStatus,
  payBooking,
  payDeposit,
} from "@/services/bookings";
import { walletKeys } from "@/queries/useWallet";
import type { DepositInput, PaymentInput } from "@/types";

// Layer 2 — Query hooks.
export const bookingKeys = {
  mine: ["bookings", "mine"] as const,
};

// Pay / confirm / cancel move real money + Lens Xu, so refresh both ledgers too.
function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: walletKeys.summary });
  qc.invalidateQueries({ queryKey: walletKeys.transactions });
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine,
    queryFn: getMyBookings,
  });
}

export function usePaymentStatus(paymentId: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["payments", paymentId],
    queryFn: () => getPaymentStatus(paymentId),
    enabled: !!paymentId,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 5_000 : false),
  });

  // A gateway webhook changes the payment asynchronously. Refresh the booking
  // projection as soon as that payment settles so the next action (accept,
  // remaining payment, or receipt confirmation) is available immediately.
  useEffect(() => {
    const status = query.data?.status;
    if (status !== "paid" && status !== "completed" && status !== "succeeded") return;
    void qc.invalidateQueries({ queryKey: bookingKeys.mine });
  }, [qc, query.data?.status]);

  return query;
}

/**
 * Load the provider checkout details independently from the payment status.
 * Some gateways persist the intent before the QR/link is available, so keep
 * asking while the transaction is still pending instead of freezing an empty
 * QR panel after the first request.
 */
export function usePaymentQr(paymentId: string) {
  return useQuery({
    queryKey: ["payment-qr", paymentId],
    queryFn: () => getPaymentQr(paymentId),
    enabled: !!paymentId,
    retry: 2,
    refetchInterval: (query) => {
      const payment = query.state.data;
      const pending = payment?.status === "pending";
      const hasCheckout =
        typeof payment?.qr_code === "string" || typeof payment?.checkout_url === "string";
      return pending && !hasCheckout ? 2_000 : false;
    },
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

export function usePayDeposit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepositInput) => payDeposit(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.mine });
      invalidateMoney(qc);
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
