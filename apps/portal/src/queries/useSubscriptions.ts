import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi, subscriptionApi } from "@/services/backend";
import { walletKeys } from "@/queries/useWallet";
import type { PaymentMethod } from "@/types/payments";

export const subscriptionKeys = {
  plans: ["subscriptions", "plans"] as const,
  mine: ["subscriptions", "mine"] as const,
  payment: (paymentId: string) => ["subscriptions", "payment", paymentId] as const,
  paymentQr: (paymentId: string) => ["subscriptions", "payment-qr", paymentId] as const,
};

/** Active Lens membership plans available to photographers. */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn: async () =>
      (await subscriptionApi.listPlans()).items.filter((plan) => {
        const status = plan.status?.trim().toLowerCase();
        return plan.is_active !== false && status !== "inactive";
      }),
  });
}

/** The photographer's current subscription, when one has been selected. */
export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.mine,
    queryFn: subscriptionApi.getMySubscription,
  });
}

/** Start a subscription checkout for the selected photographer plan. */
export function useSubscribeToPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      photographerPlanId,
      paymentMethod,
    }: {
      photographerPlanId: string;
      paymentMethod: PaymentMethod;
    }) =>
      subscriptionApi.createSubscription({
        photographer_plan_id: photographerPlanId,
        payment_method: paymentMethod,
        idempotency_key:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
      if (variables.paymentMethod === "wallet") {
        queryClient.invalidateQueries({ queryKey: walletKeys.summary });
        queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
      }
    },
  });
}

/** Poll a subscription checkout until the payment provider confirms it. */
export function useSubscriptionPaymentStatus(paymentId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: subscriptionKeys.payment(paymentId),
    queryFn: () => paymentApi.getPayment(paymentId),
    enabled: Boolean(paymentId),
    refetchInterval: (current) => {
      const payment = current.state.data;
      const status = String(payment?.status ?? "pending").toLowerCase();
      if (["paid", "completed", "succeeded", "failed", "expired", "cancelled"].includes(status)) {
        return false;
      }
      if (payment?.checkout_expired && !payment.checkout_review_required_at) return false;
      return payment?.checkout_review_required_at ? 15000 : 3000;
    },
  });

  useEffect(() => {
    const status = String(query.data?.status ?? "").toLowerCase();
    if (!["paid", "completed", "succeeded"].includes(status)) return;
    void queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
  }, [query.data?.status, queryClient]);

  return query;
}

/** Fetch QR/checkout data if the payment-intent response did not include it yet. */
export function useSubscriptionPaymentQr(paymentId: string) {
  return useQuery({
    queryKey: subscriptionKeys.paymentQr(paymentId),
    queryFn: () => paymentApi.getPaymentQr(paymentId),
    enabled: Boolean(paymentId),
    refetchInterval: (current) => {
      const status = String(current.state.data?.status ?? "pending").toLowerCase();
      const hasCheckout =
        typeof current.state.data?.qr_code === "string" ||
        typeof current.state.data?.checkout_url === "string";
      return status === "pending" && !hasCheckout ? 5000 : false;
    },
  });
}
