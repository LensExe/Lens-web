import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "@/services/backend";

export const subscriptionKeys = {
  plans: ["subscriptions", "plans"] as const,
  mine: ["subscriptions", "mine"] as const,
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
    mutationFn: (photographerPlanId: string) =>
      subscriptionApi.createSubscription({
        photographer_plan_id: photographerPlanId,
        idempotency_key:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
    },
  });
}
